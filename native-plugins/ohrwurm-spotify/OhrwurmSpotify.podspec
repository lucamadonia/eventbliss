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
  # SpotifyiOS (App Remote) must be available to the App target.
  # Easiest: add SpotifyiOS.xcframework manually to the App target (see SETUP.md),
  # OR uncomment the line below if you vendor the framework here:
  # s.vendored_frameworks = 'ios/Frameworks/SpotifyiOS.xcframework'
  s.swift_version = '5.1'
end
