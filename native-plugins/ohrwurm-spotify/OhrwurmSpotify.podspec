require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'OhrwurmSpotify'
  s.version = package['version']
  s.summary = package['description']
  s.license = 'MIT'
  s.homepage = 'https://event-bliss.com'
  s.author = 'EventBliss'
  s.source = { :git => 'https://github.com/lucamadonia/eventbliss.git', :tag => s.version.to_s }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '14.0'
  s.dependency 'Capacitor'
  # SpotifyiOS App Remote framework. The binary is NOT committed — it is fetched
  # into ios/Frameworks/ by a CI step (or locally, see SETUP.md) before
  # `pod install`, because CocoaPods does not run prepare_command for local
  # (:path) pods like Capacitor plugins.
  s.vendored_frameworks = 'ios/Frameworks/SpotifyiOS.xcframework'
  s.swift_version = '5.1'
end
