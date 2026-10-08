package app.eventbliss;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.FirebaseApp;

@CapacitorPlugin(name = "FirebaseStatus")
public class FirebaseStatusPlugin extends Plugin {
    @PluginMethod
    public void isConfigured(PluginCall call) {
        boolean configured;
        try {
            FirebaseApp.getInstance();
            configured = true;
        } catch (IllegalStateException missingDefaultApp) {
            configured = false;
        }

        JSObject result = new JSObject();
        result.put("configured", configured);
        call.resolve(result);
    }
}
