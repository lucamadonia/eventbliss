// swift-tools-version: 5.9
import PackageDescription

// SPM-Manifest fuer das OHRWURM-Spotify-Plugin.
//
// Das iOS-App-Projekt (ios/App) ist ein Swift-Package-Manager-Projekt
// (CapApp-SPM/Package.swift, kein Podfile). Capacitor bindet Plugins per SPM
// ein und ueberspringt jedes Plugin OHNE Package.swift ("not compatible with
// SPM") — genau das war die Ursache fuer "OhrwurmSpotify plugin is not
// implemented on iOS": das Plugin wurde nie einkompiliert.
//
// Die SpotifyiOS.xcframework wird NICHT eingecheckt; die CI laedt sie vor
// `cap sync ios` nach ios/Frameworks/ (siehe .github/workflows/ios-testflight.yml
// und SETUP.md) und sie wird hier als binaryTarget eingebunden.
let package = Package(
    name: "OhrwurmSpotify",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "OhrwurmSpotify",
            targets: ["OhrwurmSpotifyPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .binaryTarget(
            name: "SpotifyiOS",
            path: "ios/Frameworks/SpotifyiOS.xcframework"),
        .target(
            name: "OhrwurmSpotifyPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                "SpotifyiOS"
            ],
            path: "ios/Plugin")
    ]
)
