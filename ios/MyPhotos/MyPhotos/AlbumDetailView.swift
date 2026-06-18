import SwiftUI

struct AlbumDetailView: View {
    let albumId: String
    let albumName: String

    @State private var album: AlbumWithPhotos?
    @State private var loading = true
    @State private var error: String?
    @State private var showingAddPhotos = false
    @State private var selectedPhoto: Photo?

    let columns = [GridItem(.adaptive(minimum: 120), spacing: 2)]

    var body: some View {
        Group {
            if loading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let err = error {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                    Text(err)
                        .foregroundStyle(.secondary)
                    Button("Retry") { Task { await load() } }
                }
            } else if let album {
                if album.photos.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text("No photos in this album")
                            .foregroundStyle(.secondary)
                        Button("Add Photos") { showingAddPhotos = true }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 2) {
                            ForEach(album.photos) { photo in
                                ThumbnailCell(photo: photo)
                                    .onTapGesture { selectedPhoto = photo }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(albumName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showingAddPhotos = true } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .task { await load() }
        .sheet(item: $selectedPhoto) { photo in
            LightboxView(photo: photo)
        }
        .sheet(isPresented: $showingAddPhotos, onDismiss: { Task { await load() } }) {
            AddPhotosSheet(
                albumId: albumId,
                existingPhotoIds: Set(album?.photos.map(\.id) ?? [])
            )
        }
    }

    private func load() async {
        loading = true
        error = nil
        do {
            album = try await APIClient.shared.album(albumId)
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}

struct AddPhotosSheet: View {
    let albumId: String
    let existingPhotoIds: Set<String>

    @Environment(\.dismiss) private var dismiss
    @State private var timeline: [TimelineYear] = []
    @State private var loading = true
    @State private var selected: Set<String> = []
    @State private var adding = false

    let columns = [GridItem(.adaptive(minimum: 100), spacing: 2)]

    var availablePhotos: [Photo] {
        timeline
            .flatMap { $0.months.flatMap { $0.photos } }
            .filter { !existingPhotoIds.contains($0.id) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if availablePhotos.isEmpty {
                    Text("All photos are already in this album")
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 2) {
                            ForEach(availablePhotos) { photo in
                                SelectableThumbnail(
                                    photo: photo,
                                    isSelected: selected.contains(photo.id)
                                ) {
                                    if selected.contains(photo.id) {
                                        selected.remove(photo.id)
                                    } else {
                                        selected.insert(photo.id)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle(selected.isEmpty ? "Select Photos" : "\(selected.count) Selected")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") { Task { await addPhotos() } }
                        .disabled(selected.isEmpty || adding)
                }
            }
            .task { await loadTimeline() }
        }
    }

    private func loadTimeline() async {
        do {
            timeline = try await APIClient.shared.timeline()
        } catch {}
        loading = false
    }

    private func addPhotos() async {
        adding = true
        do {
            try await APIClient.shared.addPhotosToAlbum(albumId, photoIds: Array(selected))
            dismiss()
        } catch {
            adding = false
        }
    }
}

struct SelectableThumbnail: View {
    let photo: Photo
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .topTrailing) {
                AsyncImage(url: APIClient.shared.thumbnailURL(for: photo)) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Rectangle().fill(Color.secondary.opacity(0.2))
                }
                .frame(width: geo.size.width, height: geo.size.width)
                .clipped()
                .overlay(isSelected ? Color.blue.opacity(0.25) : Color.clear)

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.white, .blue)
                        .padding(4)
                }
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .onTapGesture { onTap() }
    }
}
