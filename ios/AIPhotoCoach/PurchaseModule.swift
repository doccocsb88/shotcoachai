import Foundation
import StoreKit
import UIKit

@objc(PurchaseModule)
final class PurchaseModule: NSObject {
  private let productIds: Set<String> = [
    "co.q7labs.shotcoachai.weekly1",
    "co.q7labs.shotcoachai.monthlytrial1",
    "co.q7labs.shotcoachai.lifetime1"
  ]
  private var productsById: [String: Product] = [:]
  private var updatesTask: Task<Void, Never>?

  override init() {
    super.init()
    updatesTask = listenForTransactionUpdates()
  }

  deinit {
    updatesTask?.cancel()
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(getProducts:rejecter:)
  func getProducts(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      do {
        let products = try await loadProducts()
        resolve(products.map(productPayload))
      } catch {
        rejectPurchaseError(reject, code: "PRODUCTS_FAILED", error: error)
      }
    }
  }

  @objc(purchase:resolver:rejecter:)
  func purchase(
    _ productId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task { @MainActor in
      do {
        let product = try await product(for: productId)
        let result = try await product.purchase()

        switch result {
        case .success(let verification):
          let transaction = try checkVerified(verification)
          await transaction.finish()
          resolve([
            "status": "purchased",
            "transaction": transactionPayload(transaction),
            "activeEntitlements": await activeEntitlementPayloads()
          ])
        case .userCancelled:
          resolve(["status": "cancelled"])
        case .pending:
          resolve(["status": "pending"])
        @unknown default:
          resolve(["status": "unknown"])
        }
      } catch {
        rejectPurchaseError(reject, code: "PURCHASE_FAILED", error: error)
      }
    }
  }

  @objc(restore:rejecter:)
  func restore(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      do {
        try await AppStore.sync()
        resolve([
          "status": "restored",
          "activeEntitlements": await activeEntitlementPayloads()
        ])
      } catch {
        rejectPurchaseError(reject, code: "RESTORE_FAILED", error: error)
      }
    }
  }

  @objc(verify:rejecter:)
  func verify(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      resolve([
        "isPremium": await hasActiveEntitlement(),
        "activeEntitlements": await activeEntitlementPayloads()
      ])
    }
  }

  @objc(manageSubscriptions:rejecter:)
  func manageSubscriptions(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task { @MainActor in
      do {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
          throw PurchaseError.storefrontUnavailable
        }
        try await AppStore.showManageSubscriptions(in: scene)
        resolve(["status": "opened"])
      } catch {
        rejectPurchaseError(reject, code: "MANAGE_SUBSCRIPTIONS_FAILED", error: error)
      }
    }
  }

  private func listenForTransactionUpdates() -> Task<Void, Never> {
    Task.detached { [weak self] in
      for await result in Transaction.updates {
        guard let self else { return }
        if let transaction = try? self.checkVerified(result) {
          await transaction.finish()
        }
      }
    }
  }

  private func loadProducts() async throws -> [Product] {
    let products = try await Product.products(for: productIds)
    productsById = Dictionary(uniqueKeysWithValues: products.map { ($0.id, $0) })
    return products.sorted { left, right in
      productSortIndex(left.id) < productSortIndex(right.id)
    }
  }

  private func product(for productId: String) async throws -> Product {
    if let product = productsById[productId] {
      return product
    }

    _ = try await loadProducts()
    guard let product = productsById[productId] else {
      throw PurchaseError.productNotFound(productId)
    }
    return product
  }

  private func activeEntitlementPayloads() async -> [[String: Any]] {
    var entitlements: [[String: Any]] = []

    for await result in Transaction.currentEntitlements {
      guard let transaction = try? checkVerified(result), productIds.contains(transaction.productID) else {
        continue
      }
      entitlements.append(transactionPayload(transaction))
    }

    return entitlements
  }

  private func hasActiveEntitlement() async -> Bool {
    for await result in Transaction.currentEntitlements {
      guard let transaction = try? checkVerified(result) else {
        continue
      }
      if productIds.contains(transaction.productID) {
        return true
      }
    }
    return false
  }

  private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
    switch result {
    case .verified(let signedType):
      return signedType
    case .unverified(_, let verificationError):
      throw verificationError
    }
  }

  private func productPayload(_ product: Product) -> [String: Any] {
    [
      "id": product.id,
      "displayName": product.displayName,
      "description": product.description,
      "displayPrice": product.displayPrice,
      "type": String(describing: product.type)
    ]
  }

  private func transactionPayload(_ transaction: Transaction) -> [String: Any] {
    var payload: [String: Any] = [
      "id": String(transaction.id),
      "originalId": String(transaction.originalID),
      "productId": transaction.productID,
      "purchaseDate": iso8601(transaction.purchaseDate),
      "environment": transactionEnvironment(transaction),
      "ownershipType": String(describing: transaction.ownershipType)
    ]

    if let expirationDate = transaction.expirationDate {
      payload["expirationDate"] = iso8601(expirationDate)
    }
    if let revocationDate = transaction.revocationDate {
      payload["revocationDate"] = iso8601(revocationDate)
    }

    return payload
  }

  private func productSortIndex(_ productId: String) -> Int {
    switch productId {
    case "co.q7labs.shotcoachai.weekly1":
      return 0
    case "co.q7labs.shotcoachai.monthlytrial1":
      return 1
    case "co.q7labs.shotcoachai.lifetime1":
      return 2
    default:
      return 99
    }
  }

  private func transactionEnvironment(_ transaction: Transaction) -> String {
    if #available(iOS 16.0, *) {
      return String(describing: transaction.environment)
    }

    return "unknown"
  }

  private func iso8601(_ date: Date) -> String {
    ISO8601DateFormatter().string(from: date)
  }

  private func rejectPurchaseError(
    _ reject: RCTPromiseRejectBlock,
    code: String,
    error: Error
  ) {
    reject(code, error.localizedDescription, error)
  }
}

private enum PurchaseError: LocalizedError {
  case productNotFound(String)
  case storefrontUnavailable

  var errorDescription: String? {
    switch self {
    case .productNotFound(let productId):
      return "StoreKit product was not found: \(productId)"
    case .storefrontUnavailable:
      return "Storefront is unavailable."
    }
  }
}
