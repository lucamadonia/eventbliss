#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Registers the plugin + methods with Capacitor's bridge.
CAP_PLUGIN(OhrwurmSpotifyPlugin, "OhrwurmSpotify",
  CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(connect, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(play, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(pause, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(resume, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(disconnect, CAPPluginReturnPromise);
)
