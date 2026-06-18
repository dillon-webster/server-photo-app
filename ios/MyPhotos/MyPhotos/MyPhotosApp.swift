//
//  MyPhotosApp.swift
//  MyPhotos
//
//  Created by Dillon Webster on 6/18/26.
//

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
            }
        }
    }
}
