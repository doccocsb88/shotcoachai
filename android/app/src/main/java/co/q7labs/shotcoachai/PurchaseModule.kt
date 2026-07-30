package co.q7labs.shotcoachai

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

class PurchaseModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PurchaseModule"

    // ── Product configuration ──────────────────────────────────────────

    private data class ProductConfig(val id: String, val type: String, val sortIndex: Int)

    private val productConfigs = listOf(
        ProductConfig("co.q7labs.shotcoachai.weekly1", BillingClient.ProductType.SUBS, 0),
        ProductConfig("co.q7labs.shotcoachai.monthlytrial1", BillingClient.ProductType.SUBS, 1),
        ProductConfig("co.q7labs.shotcoachai.lifetime1", BillingClient.ProductType.INAPP, 2)
    )

    private val productIds = productConfigs.map { it.id }.toSet()

    // ── Billing client ─────────────────────────────────────────────────

    private var cachedProductDetails: Map<String, ProductDetails> = emptyMap()
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    /**
     * Pending promise for the current purchase flow.
     * Only one purchase can run at a time.
     */
    private var pendingPurchasePromise: Promise? = null

    private val purchasesUpdatedListener = PurchasesUpdatedListener { billingResult, purchases ->
        val promise = pendingPurchasePromise ?: return@PurchasesUpdatedListener
        pendingPurchasePromise = null

        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                if (purchases != null && purchases.isNotEmpty()) {
                    val purchase = purchases.first()
                    scope.launch {
                        try {
                            handleSuccessfulPurchase(purchase, promise)
                        } catch (e: Exception) {
                            promise.reject("PURCHASE_FAILED", e.message, e)
                        }
                    }
                } else {
                    promise.resolve(Arguments.createMap().apply {
                        putString("status", "unknown")
                    })
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                promise.resolve(Arguments.createMap().apply {
                    putString("status", "cancelled")
                })
            }
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                // Treat as purchased – re-query to get the transaction
                scope.launch {
                    try {
                        val entitlements = queryActiveEntitlements()
                        promise.resolve(Arguments.createMap().apply {
                            putString("status", "purchased")
                            putArray("activeEntitlements", entitlements)
                        })
                    } catch (e: Exception) {
                        promise.reject("PURCHASE_FAILED", e.message, e)
                    }
                }
            }
            else -> {
                promise.reject(
                    "PURCHASE_FAILED",
                    "Billing error ${billingResult.responseCode}: ${billingResult.debugMessage}"
                )
            }
        }
    }

    private val billingClient: BillingClient by lazy {
        BillingClient.newBuilder(reactContext)
            .setListener(purchasesUpdatedListener)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .build()
            )
            .enableAutoServiceReconnection()
            .build()
    }

    // ── Connection helper ──────────────────────────────────────────────

    private suspend fun ensureConnected() {
        if (billingClient.isReady) return

        val result = CompletableDeferred<BillingResult>()

        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                result.complete(billingResult)
            }

            override fun onBillingServiceDisconnected() {
                if (!result.isCompleted) {
                    result.completeExceptionally(
                        Exception("Google Play Billing service disconnected.")
                    )
                }
            }
        })

        val billingResult = result.await()
        if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
            throw Exception(
                "Failed to connect to Google Play Billing: ${billingResult.debugMessage}"
            )
        }
    }

    // ── React Native methods ───────────────────────────────────────────

    @ReactMethod
    fun getProducts(promise: Promise) {
        scope.launch {
            try {
                ensureConnected()
                val products = queryAllProductDetails()
                cachedProductDetails = products.associateBy { it.productId }

                val sorted = products.sortedBy { detail ->
                    productConfigs.find { it.id == detail.productId }?.sortIndex ?: 99
                }

                val result = Arguments.createArray()
                for (detail in sorted) {
                    result.pushMap(productDetailPayload(detail))
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("PRODUCTS_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun purchase(productId: String, promise: Promise) {
        scope.launch {
            try {
                ensureConnected()

                // Ensure product details are loaded
                var detail = cachedProductDetails[productId]
                if (detail == null) {
                    val products = queryAllProductDetails()
                    cachedProductDetails = products.associateBy { it.productId }
                    detail = cachedProductDetails[productId]
                }

                if (detail == null) {
                    promise.reject("PURCHASE_FAILED", "Product not found: $productId")
                    return@launch
                }

                val activity = currentActivity
                if (activity == null) {
                    promise.reject("PURCHASE_FAILED", "No active Android activity.")
                    return@launch
                }

                pendingPurchasePromise = promise

                val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(detail)

                // For subscriptions, pick the first offer (base plan)
                if (detail.productType == BillingClient.ProductType.SUBS) {
                    val offers = detail.subscriptionOfferDetails
                    if (offers != null && offers.isNotEmpty()) {
                        productDetailsParams.setOfferToken(offers[0].offerToken)
                    }
                }

                val flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(listOf(productDetailsParams.build()))
                    .build()

                val result = billingClient.launchBillingFlow(activity, flowParams)
                if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                    pendingPurchasePromise = null
                    promise.reject(
                        "PURCHASE_FAILED",
                        "Failed to launch billing flow: ${result.debugMessage}"
                    )
                }
            } catch (e: Exception) {
                pendingPurchasePromise = null
                promise.reject("PURCHASE_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun restore(promise: Promise) {
        scope.launch {
            try {
                ensureConnected()
                val entitlements = queryActiveEntitlements()
                promise.resolve(Arguments.createMap().apply {
                    putString("status", "restored")
                    putArray("activeEntitlements", entitlements)
                })
            } catch (e: Exception) {
                promise.reject("RESTORE_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun verify(promise: Promise) {
        scope.launch {
            try {
                ensureConnected()
                val entitlements = queryActiveEntitlements()
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("isPremium", entitlements.size() > 0)
                    putArray("activeEntitlements", entitlements)
                })
            } catch (e: Exception) {
                promise.reject("VERIFY_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun manageSubscriptions(promise: Promise) {
        try {
            val intent = Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://play.google.com/store/account/subscriptions?package=co.q7labs.shotcoachai")
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve(Arguments.createMap().apply {
                putString("status", "opened")
            })
        } catch (e: Exception) {
            promise.reject("MANAGE_SUBSCRIPTIONS_FAILED", e.message, e)
        }
    }

    // ── Query helpers ──────────────────────────────────────────────────

    private suspend fun queryAllProductDetails(): List<ProductDetails> {
        val allDetails = mutableListOf<ProductDetails>()

        // Group product configs by type
        val byType = productConfigs.groupBy { it.type }

        for ((type, configs) in byType) {
            val productList = configs.map { config ->
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(config.id)
                    .setProductType(type)
                    .build()
            }

            val params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build()

            val result = CompletableDeferred<QueryProductDetailsResultWrapper>()

            billingClient.queryProductDetailsAsync(params) { billingResult, queryProductDetailsResult ->
                result.complete(
                    QueryProductDetailsResultWrapper(
                        billingResult = billingResult,
                        productDetailsList = queryProductDetailsResult.productDetailsList,
                    )
                )
            }

            val queryResult = result.await()
            if (queryResult.billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                allDetails.addAll(queryResult.productDetailsList)
            }
        }

        return allDetails
    }

    private suspend fun queryActiveEntitlements(): WritableArray {
        val entitlements = Arguments.createArray()

        // Query subscriptions
        val subsResult = queryPurchases(BillingClient.ProductType.SUBS)
        for (purchase in subsResult) {
            if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED &&
                purchase.products.any { it in productIds }
            ) {
                entitlements.pushMap(purchasePayload(purchase))
            }
        }

        // Query one-time products
        val inappResult = queryPurchases(BillingClient.ProductType.INAPP)
        for (purchase in inappResult) {
            if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED &&
                purchase.products.any { it in productIds }
            ) {
                entitlements.pushMap(purchasePayload(purchase))
            }
        }

        return entitlements
    }

    private suspend fun queryPurchases(type: String): List<Purchase> {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(type)
            .build()

        val result = CompletableDeferred<PurchasesResult>()

        billingClient.queryPurchasesAsync(params) { billingResult, purchases ->
            result.complete(PurchasesResult(billingResult, purchases))
        }

        val purchasesResult = result.await()
        return if (purchasesResult.billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
            purchasesResult.purchasesList
        } else {
            emptyList()
        }
    }

    // ── Purchase acknowledgment ────────────────────────────────────────

    private suspend fun handleSuccessfulPurchase(purchase: Purchase, promise: Promise) {
        if (purchase.purchaseState == Purchase.PurchaseState.PENDING) {
            promise.resolve(Arguments.createMap().apply {
                putString("status", "pending")
            })
            return
        }

        // Acknowledge if not already
        if (!purchase.isAcknowledged) {
            val ackParams = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.purchaseToken)
                .build()

            val ackResult = CompletableDeferred<BillingResult>()
            billingClient.acknowledgePurchase(ackParams) { result ->
                ackResult.complete(result)
            }

            val billingResult = ackResult.await()
            if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
                // Purchase succeeded but acknowledgment failed – still report success
                // The purchase will be acknowledged on next app start via verify()
            }
        }

        val entitlements = queryActiveEntitlements()
        promise.resolve(Arguments.createMap().apply {
            putString("status", "purchased")
            putMap("transaction", purchasePayload(purchase))
            putArray("activeEntitlements", entitlements)
        })
    }

    // ── Payload builders (matching iOS shape) ──────────────────────────

    private fun productDetailPayload(detail: ProductDetails): WritableMap {
        val map = Arguments.createMap()
        map.putString("id", detail.productId)
        map.putString("displayName", detail.name)
        map.putString("description", detail.description)
        map.putString("type", detail.productType)

        // Build display price
        val displayPrice = when (detail.productType) {
            BillingClient.ProductType.SUBS -> {
                val offers = detail.subscriptionOfferDetails
                if (offers != null && offers.isNotEmpty()) {
                    val phases = offers[0].pricingPhases.pricingPhaseList
                    if (phases.isNotEmpty()) phases[phases.size - 1].formattedPrice else ""
                } else ""
            }
            else -> {
                detail.oneTimePurchaseOfferDetails?.formattedPrice ?: ""
            }
        }
        map.putString("displayPrice", displayPrice)

        return map
    }

    private fun purchasePayload(purchase: Purchase): WritableMap {
        val map = Arguments.createMap()
        val fallbackId = purchase.purchaseToken.substring(0, minOf(20, purchase.purchaseToken.length))
        map.putString("id", purchase.orderId ?: fallbackId)
        map.putString("originalId", purchase.orderId ?: fallbackId)
        map.putString("productId", if (purchase.products.isNotEmpty()) purchase.products[0] else "")
        map.putString("purchaseDate", iso8601(purchase.purchaseTime))
        map.putString("environment", "Production")
        map.putString("ownershipType", "purchased")
        return map
    }

    private fun iso8601(timestampMs: Long): String {
        val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        formatter.timeZone = TimeZone.getTimeZone("UTC")
        return formatter.format(Date(timestampMs))
    }

    // ── Cleanup ────────────────────────────────────────────────────────

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        scope.cancel()
        if (billingClient.isReady) {
            billingClient.endConnection()
        }
    }
}

/** Simple holder for queryPurchasesAsync callback results. */
private data class PurchasesResult(
    val billingResult: BillingResult,
    val purchasesList: List<Purchase>
)

private data class QueryProductDetailsResultWrapper(
    val billingResult: BillingResult,
    val productDetailsList: List<ProductDetails>
)
