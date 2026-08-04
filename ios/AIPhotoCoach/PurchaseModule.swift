import Foundation
import StoreKit
import UIKit
import React

@objc(PurchaseModule)
final class PurchaseModule: NSObject {
  private let productIds = [
    "co.q7labs.shotcoachai.weekly1",
    "co.q7labs.shotcoachai.monthlytrial1",
    "co.q7labs.shotcoachai.lifetime1"
  ]

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
        let products = try await Product.products(for: productIds)
        let sortedProducts = products.sorted { lhs, rhs in
          productIds.firstIndex(of: lhs.id) ?? .max < productIds.firstIndex(of: rhs.id) ?? .max
        }
        resolve(sortedProducts.map(makeProductPayload))
      } catch {
        reject("purchase_products_failed", error.localizedDescription, error)
      }
    }
  }

  @objc(purchase:resolver:rejecter:)
  func purchase(
    _ productId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      do {
        let products = try await Product.products(for: [productId])
        guard let product = products.first else {
          resolve(["status": "unknown"])
          return
        }

        let result = try await product.purchase()
        switch result {
        case .success(let verification):
          let transaction = try checkVerified(verification)
          let payload = makeTransactionPayload(transaction)
          await transaction.finish()
          resolve([
            "status": "purchased",
            "transaction": payload,
            "activeEntitlements": try await currentEntitlementPayloads()
          ])
        case .userCancelled:
          resolve(["status": "cancelled"])
        case .pending:
          resolve(["status": "pending"])
        @unknown default:
          resolve(["status": "unknown"])
        }
      } catch {
        reject("purchase_failed", error.localizedDescription, error)
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
          "activeEntitlements": try await currentEntitlementPayloads()
        ])
      } catch {
        reject("purchase_restore_failed", error.localizedDescription, error)
      }
    }
  }

  @objc(verify:rejecter:)
  func verify(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      do {
        let entitlements = try await currentEntitlementPayloads()
        resolve([
          "isPremium": !entitlements.isEmpty,
          "activeEntitlements": entitlements
        ])
      } catch {
        reject("purchase_verify_failed", error.localizedDescription, error)
      }
    }
  }

  @objc(manageSubscriptions:rejecter:)
  func manageSubscriptions(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task { @MainActor in
      guard let url = URL(string: "https://apps.apple.com/account/subscriptions") else {
        reject("purchase_manage_unavailable", "Subscriptions URL is invalid.", nil)
        return
      }

      UIApplication.shared.open(url, options: [:]) { success in
        if success {
          resolve(["status": "opened"])
        } else {
          reject("purchase_manage_unavailable", "Could not open subscriptions management.", nil)
        }
      }
    }
  }

  private func currentEntitlementPayloads() async throws -> [[String: Any]] {
    var entitlements: [[String: Any]] = []

    for await result in Transaction.currentEntitlements {
      guard case .verified(let transaction) = result else {
        continue
      }
      guard productIds.contains(transaction.productID) else {
        continue
      }
      guard transaction.revocationDate == nil else {
        continue
      }
      entitlements.append(makeTransactionPayload(transaction))
    }

    return entitlements
  }

  private func makeProductPayload(_ product: Product) -> [String: Any] {
    [
      "id": product.id,
      "displayName": product.displayName,
      "description": product.description,
      "displayPrice": product.displayPrice,
      "type": String(describing: product.type)
    ]
  }

  private func makeTransactionPayload(_ transaction: Transaction) -> [String: Any] {
    var payload: [String: Any] = [
      "id": String(transaction.id),
      "originalId": String(transaction.originalID),
      "productId": transaction.productID,
      "purchaseDate": iso8601(transaction.purchaseDate),
      "ownershipType": String(describing: transaction.ownershipType)
    ]

    if #available(iOS 16.0, *) {
      payload["environment"] = String(describing: transaction.environment)
    } else {
      payload["environment"] = "unknown"
    }

    if let expirationDate = transaction.expirationDate {
      payload["expirationDate"] = iso8601(expirationDate)
    }
    if let revocationDate = transaction.revocationDate {
      payload["revocationDate"] = iso8601(revocationDate)
    }

    return payload
  }

  private func iso8601(_ date: Date) -> String {
    ISO8601DateFormatter().string(from: date)
  }

  private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
    switch result {
    case .verified(let safe):
      return safe
    case .unverified:
      throw NSError(
        domain: "PurchaseModule",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "StoreKit transaction could not be verified."]
      )
    }
  }
}
