import Foundation
import Security

private let keychainService = "MyPhotos"
private let keychainAccount = "authToken"

extension Notification.Name {
    static let unauthorized = Notification.Name("unauthorized")
}

class APIClient {
    static let shared = APIClient()

    var pendingBaseURL: String?

    var baseURL: String {
        pendingBaseURL ?? UserDefaults.standard.string(forKey: "serverURL") ?? ""
    }

    var authToken: String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecReturnData as String: true,
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func setAuthToken(_ token: String) {
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecValueData as String: token.data(using: .utf8)!,
        ]
        SecItemAdd(addQuery as CFDictionary, nil)
    }

    func clearAuthToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
        ]
        SecItemDelete(query as CFDictionary)
    }

    private func addAuthHeader(_ request: inout URLRequest) {
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }

    private func checkStatus(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        if http.statusCode == 401 {
            clearAuthToken()
            NotificationCenter.default.post(name: .unauthorized, object: nil)
            throw URLError(.userAuthenticationRequired)
        }
        guard (200..<300).contains(http.statusCode) else { throw URLError(.badServerResponse) }
    }

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    private func get<T: Decodable>(_ path: String) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        addAuthHeader(&request)
        let (data, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            let raw = String(data: data, encoding: .utf8) ?? "unreadable"
            print("Decode error: \(error)\nRaw: \(raw.prefix(500))")
            throw error
        }
    }

    private func post<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        guard let url = URL(string: baseURL + path) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        addAuthHeader(&request)
        let (data, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response)
        return try decoder.decode(T.self, from: data)
    }

    private func postVoid<B: Encodable>(_ path: String, body: B) async throws {
        guard let url = URL(string: baseURL + path) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        addAuthHeader(&request)
        let (_, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response)
    }

    private func deleteRequest(_ path: String) async throws {
        guard let url = URL(string: baseURL + path) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        addAuthHeader(&request)
        let (_, response) = try await URLSession.shared.data(for: request)
        try checkStatus(response)
    }

    func login(password: String) async throws {
        struct LoginBody: Encodable { let password: String }
        struct LoginResponse: Decodable { let token: String }
        guard let url = URL(string: baseURL + "/api/auth/login") else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(LoginBody(password: password))
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.userAuthenticationRequired)
        }
        let loginResponse = try decoder.decode(LoginResponse.self, from: data)
        setAuthToken(loginResponse.token)
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
