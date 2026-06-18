import SwiftUI

struct TimelineView: View {
    @State private var timeline: [TimelineYear] = []
    @State private var error: String?
    @State private var loading = true
    @State private var selectedPhoto: Photo?

    let columns = [GridItem(.adaptive(minimum: 120), spacing: 2)]

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView()
                } else if let error {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text(error)
                            .foregroundStyle(.secondary)
                        Button("Retry") { Task { await load() } }
                    }
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, pinnedViews: .sectionHeaders) {
                            ForEach(timeline) { year in
                                ForEach(year.months, id: \.month) { month in
                                    Section {
                                        LazyVGrid(columns: columns, spacing: 2) {
                                            ForEach(month.photos) { photo in
                                                ThumbnailCell(photo: photo)
                                                    .onTapGesture { selectedPhoto = photo }
                                            }
                                        }
                                    } header: {
                                        Text("\(month.month) \(year.year)")
                                            .font(.headline)
                                            .padding(.horizontal)
                                            .padding(.vertical, 8)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                            .background(.ultraThinMaterial)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Photos")
            .task { await load() }
            .sheet(item: $selectedPhoto) { photo in
                LightboxView(photo: photo)
            }
        }
    }

    private func load() async {
        loading = true
        error = nil
        do {
            timeline = try await APIClient.shared.timeline()
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}

struct ThumbnailCell: View {
    let photo: Photo

    var body: some View {
        GeometryReader { geo in
            AsyncImage(url: APIClient.shared.thumbnailURL(for: photo)) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Rectangle().fill(Color.secondary.opacity(0.2))
            }
            .frame(width: geo.size.width, height: geo.size.width)
            .clipped()
        }
        .aspectRatio(1, contentMode: .fit)
    }
}
