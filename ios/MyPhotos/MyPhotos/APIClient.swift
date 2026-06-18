import Foundation

class APIClient {
    static let shared = APIClient()

    // Change this to your server's Tailscale IP
    var baseURL = "http://100.100.212.32:3002"

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

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

    private func post<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try decoder.decode(T.self, from: data)
    }

    private func postVoid<B: Encodable>(_ path: String, body: B) async throws {
        guard let url = URL(string: baseURL + path) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }

    private func deleteRequest(_ path: String) async throws {
        guard let url = URL(string: baseURL + path) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
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

    func createAlbum(name: String) async throws -> Album {
        try await post("/api/albums", body: ["name": name])
    }

    func deleteAlbum(_ id: String) async throws {
        try await deleteRequest("/api/albums/\(id)")
    }

    func addPhotosToAlbum(_ albumId: String, photoIds: [String]) async throws {
        try await postVoid("/api/albums/\(albumId)/photos", body: ["photoIds": photoIds])
    }

    func thumbnailURL(for photo: Photo) -> URL? {
        URL(string: "\(baseURL)/uploads/thumbnails/\(photo.id).webp")
    }

    func thumbnailURL(forId id: String) -> URL? {
        URL(string: "\(baseURL)/uploads/thumbnails/\(id).webp")
    }

    func originalURL(for photo: Photo) -> URL? {
        URL(string: "\(baseURL)/uploads/originals/\(photo.filename)")
    }
}
