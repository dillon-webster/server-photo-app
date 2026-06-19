import SwiftUI

@main
struct MyPhotosApp: App {
    @AppStorage("serverURL") private var serverURL: String = ""

    var body: some Scene {
        WindowGroup {
            if serverURL.isEmpty {
                ServerSetupView()
            } else {
                TabView {
                    TimelineView()
                        .tabItem { Label("Photos", systemImage: "photo.on.rectangle") }
                    MapView()
                        .tabItem { Label("Map", systemImage: "map") }
                    AlbumsView()
                        .tabItem { Label("Albums", systemImage: "rectangle.stack") }
                }
                .onReceive(NotificationCenter.default.publisher(for: .unauthorized)) { _ in
                    serverURL = ""
                }
            }
        }
    }
}
