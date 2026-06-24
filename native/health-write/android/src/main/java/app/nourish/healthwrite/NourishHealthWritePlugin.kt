// SKELETON — untested. Build in Android Studio after `npx cap add android`.
// Requires the androidx.health.connect:connect-client dependency and the
// Health Connect write permissions in AndroidManifest (see native/README.md).
// Record constructor params can vary by connect-client version — verify on build.
package app.nourish.healthwrite

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.HydrationRecord
import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.units.Energy
import androidx.health.connect.client.units.Mass
import androidx.health.connect.client.units.Volume
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneOffset

@CapacitorPlugin(name = "NourishHealthWrite")
class NourishHealthWritePlugin : Plugin() {

    private fun client() = HealthConnectClient.getOrCreate(context)

    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        // TODO(native): drive the Health Connect permission contract (ActivityResult)
        // for WRITE_NUTRITION + WRITE_HYDRATION. This stub reports SDK availability only.
        val available = HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
        call.resolve(JSObject().put("granted", available))
    }

    @PluginMethod
    fun writeNutrition(call: PluginCall) {
        val kcal = call.getDouble("kcal") ?: 0.0
        val protein = call.getDouble("protein") ?: 0.0
        val carbs = call.getDouble("carbs") ?: 0.0
        val fat = call.getDouble("fat") ?: 0.0
        val waterMl = call.getDouble("waterMl") ?: 0.0
        // TODO(native): derive start/end from call.getString("date") (yyyy-mm-dd).
        val start = Instant.now()
        val end = start

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val records = mutableListOf<Record>()
                records.add(
                    NutritionRecord(
                        startTime = start, startZoneOffset = ZoneOffset.UTC,
                        endTime = end, endZoneOffset = ZoneOffset.UTC,
                        energy = Energy.kilocalories(kcal),
                        protein = Mass.grams(protein),
                        totalCarbohydrate = Mass.grams(carbs),
                        totalFat = Mass.grams(fat),
                    )
                )
                if (waterMl > 0) {
                    records.add(
                        HydrationRecord(
                            startTime = start, startZoneOffset = ZoneOffset.UTC,
                            endTime = end, endZoneOffset = ZoneOffset.UTC,
                            volume = Volume.milliliters(waterMl),
                        )
                    )
                }
                client().insertRecords(records)
                call.resolve(JSObject().put("ok", true))
            } catch (e: Exception) {
                call.reject(e.message ?: "Health Connect write failed")
            }
        }
    }
}
