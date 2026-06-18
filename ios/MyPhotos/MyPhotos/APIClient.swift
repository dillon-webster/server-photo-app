import Foundation

class APIClient {
    static let shared = APIClient()

    // Change this to your server's Tailscale IP
    var baseURL = "http://100.100.212.32:3002"

    private let decoder = JSONDecoder()

    private func get<T: Decodable>(_ path: String) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw URLError(.badURL)
        }
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            let raw = String(data: data, encoding: .utf8) ?? "unreadable"
            print("Decode error: \(error)")
            print("Raw response: \(raw.prefix(500))")
            throw error
        }
    }

    func timeline() async throws -> [TimelineYear] {
        try await get("/api/photos/timeline")
    }

    func mapPhotos() async throws -> [Photo] {
        try await get("/api/photos/map")
    }

    func albums() async throws -> [Album] {
        try await get("/api/albums")
    }

    func album(_ id: String) async throws -> AlbumWithPhotos {
        try await get("/api/albums/\(id)")
    }

    func thumbnailURL(for photo: Photo) -> URL? {
        URL(string: "\(baseURL)/uploads/thumbnails/\(photo.id).webp")
    }

    func originalURL(for photo: Photo) -> URL? {
        URL(string: "\(baseURL)/uploads/originals/\(photo.filename)")
    }
}
