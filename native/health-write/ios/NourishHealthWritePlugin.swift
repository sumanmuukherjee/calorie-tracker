// SKELETON — untested. Compile in Xcode after `npx cap add ios`.
// Requires: HealthKit capability + Info.plist NSHealthUpdateUsageDescription.
// Capacitor 6 self-registering plugin (CAPBridgedPlugin).
import Foundation
import Capacitor
import HealthKit

@objc(NourishHealthWritePlugin)
public class NourishHealthWritePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NourishHealthWritePlugin"
    public let jsName = "NourishHealthWrite"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeNutrition", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()

    private var writeTypes: Set<HKSampleType> {
        var s = Set<HKSampleType>()
        for id in [HKQuantityTypeIdentifier.dietaryEnergyConsumed, .dietaryProtein,
                   .dietaryCarbohydrates, .dietaryFatTotal, .dietaryWater] {
            if let t = HKObjectType.quantityType(forIdentifier: id) { s.insert(t) }
        }
        return s
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["granted": false]); return
        }
        store.requestAuthorization(toShare: writeTypes, read: []) { granted, _ in
            call.resolve(["granted": granted])
        }
    }

    @objc func writeNutrition(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit unavailable"); return
        }
        // TODO(native): parse call.getString("date") (yyyy-mm-dd) into the logged day.
        let when = Date()
        var samples: [HKSample] = []

        func add(_ id: HKQuantityTypeIdentifier, _ unit: HKUnit, _ value: Double) {
            guard value > 0, let t = HKObjectType.quantityType(forIdentifier: id) else { return }
            let q = HKQuantity(unit: unit, doubleValue: value)
            samples.append(HKQuantitySample(type: t, quantity: q, start: when, end: when))
        }
        add(.dietaryEnergyConsumed, .kilocalorie(), call.getDouble("kcal") ?? 0)
        add(.dietaryProtein, .gram(), call.getDouble("protein") ?? 0)
        add(.dietaryCarbohydrates, .gram(), call.getDouble("carbs") ?? 0)
        add(.dietaryFatTotal, .gram(), call.getDouble("fat") ?? 0)
        add(.dietaryWater, HKUnit.literUnit(with: .milli), call.getDouble("waterMl") ?? 0)

        guard !samples.isEmpty else { call.resolve(["ok": true]); return }
        store.save(samples) { ok, err in
            if let err = err { call.reject(err.localizedDescription) } else { call.resolve(["ok": ok]) }
        }
    }
}
