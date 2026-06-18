//
//  MyPhotosApp.swift
//  MyPhotos
//
//  Created by Dillon Webster on 6/18/26.
//

import SwiftUI

@main
struct MyPhotosApp: App {
    var body: some Scene {
        WindowGroup {
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
