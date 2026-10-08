package app.eventbliss;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FirebaseStatusPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
