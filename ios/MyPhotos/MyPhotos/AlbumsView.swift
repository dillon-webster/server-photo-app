import SwiftUI

struct AlbumsView: View {
    @State private var albums: [Album] = []
    @State private var loading = true
    @State private var error: String?
    @State private var showingCreate = false

    let columns = [GridItem(.adaptive(minimum: 150), spacing: 16)]

    var body: some View {
        NavigationStack {
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
                            .multilineTextAlignment(.center)
                        Button("Retry") { Task { await load() } }
                    }
                    .padding()
                } else if albums.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "rectangle.stack")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text("No albums yet")
                            .foregroundStyle(.secondary)
                        Button("Create Album") { showingCreate = true }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(albums) { album in
                                NavigationLink {
                                    AlbumDetailView(albumId: album.id, albumName: album.name)
                                } label: {
                                    AlbumCard(album: album)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Albums")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showingCreate = true } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingCreate, onDismiss: { Task { await load() } }) {
                CreateAlbumSheet()
            }
            .task { await load() }
        }
    }

    private func load() async {
        loading = true
        error = nil
        do {
            albums = try await APIClient.shared.albums()
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}

struct AlbumCard: View {
    let album: Album

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Group {
                if let coverId = album.coverPhotoId,
                   let url = APIClient.shared.thumbnailURL(forId: coverId) {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        Rectangle().fill(Color.secondary.opacity(0.2))
                    }
                } else {
                    Rectangle()
                        .fill(Color.secondary.opacity(0.15))
                        .overlay(
                            Image(systemName: "photo.on.rectangle")
                                .font(.title)
                                .foregroundStyle(.secondary)
                        )
                }
            }
            .aspectRatio(1, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .clipped()

            Text(album.name)
                .font(.subheadline)
                .fontWeight(.medium)
                .lineLimit(1)
                .foregroundStyle(.primary)
        }
    }
}

struct CreateAlbumSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var creating = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                TextField("Album name", text: $name)
                if let err = error {
                    Text(err).foregroundStyle(.red).font(.caption)
                }
            }
            .navigationTitle("New Album")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") { Task { await create() } }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || creating)
                }
            }
        }
    }

    private func create() async {
        creating = true
        error = nil
        do {
            _ = try await APIClient.shared.createAlbum(name: name.trimmingCharacters(in: .whitespaces))
            dismiss()
        } catch {
            self.error = error.localizedDescription
            creating = false
        }
    }
}
