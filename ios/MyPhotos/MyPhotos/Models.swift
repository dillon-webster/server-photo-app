import Foundation

struct Photo: Codable, Identifiable {
    let id: String
    let filename: String
    let originalName: String
    let mimeType: String
    let size: Int
    let width: Int
    let height: Int
    let duration: Double?
    let dateTaken: Double?
    let dateUploaded: Double
    let latitude: Double?
    let longitude: Double?
    let city: String?
    let country: String?
}

struct Album: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let coverPhotoId: String?
    let createdAt: Double
    let updatedAt: Double
}

struct AlbumWithPhotos: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let coverPhotoId: String?
    let createdAt: Double
    let updatedAt: Double
    let photos: [Photo]
}

struct TimelineMonth: Codable {
    let month: String
    let photos: [Photo]
}

struct TimelineYear: Codable, Identifiable {
    let year: String
    let months: [TimelineMonth]
    var id: String { year }
}
