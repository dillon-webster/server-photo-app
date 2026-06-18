import SwiftUI
import MapKit

// MARK: - MapView (SwiftUI wrapper)

struct MapView: View {
    @State private var photos: [Photo] = []
    @State private var loading = true
    @State private var error: String?
    @State private var selectedPhoto: Photo?

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
                } else if photos.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "map")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text("No photos with location data")
                            .foregroundStyle(.secondary)
                    }
                } else {
                    PhotoMapView(photos: photos) { photo in
                        selectedPhoto = photo
                    }
                    .ignoresSafeArea(edges: .bottom)
                }
            }
            .navigationTitle("Map")
            .navigationBarTitleDisplayMode(.inline)
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
            photos = try await APIClient.shared.mapPhotos()
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}

// MARK: - MKMapView wrapper with clustering

struct PhotoMapView: UIViewRepresentable {
    let photos: [Photo]
    let onSelect: (Photo) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onSelect: onSelect)
    }

    func makeUIView(context: Context) -> MKMapView {
        let map = MKMapView()
        map.delegate = context.coordinator
        map.register(PhotoPinView.self, forAnnotationViewWithReuseIdentifier: "photo")
        map.register(
            ClusterPinView.self,
            forAnnotationViewWithReuseIdentifier: MKMapViewDefaultClusterAnnotationViewReuseIdentifier
        )
        return map
    }

    func updateUIView(_ map: MKMapView, context: Context) {
        context.coordinator.onSelect = onSelect
        let current = map.annotations.compactMap { $0 as? PhotoAnnotation }
        guard current.count != photos.count else { return }
        map.removeAnnotations(map.annotations)
        let annotations = photos.compactMap { PhotoAnnotation(photo: $0) }
        map.addAnnotations(annotations)
        if !annotations.isEmpty {
            map.showAnnotations(annotations, animated: false)
        }
    }

    // MARK: Coordinator

    class Coordinator: NSObject, MKMapViewDelegate {
        var onSelect: (Photo) -> Void

        init(onSelect: @escaping (Photo) -> Void) {
            self.onSelect = onSelect
        }

        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            if annotation is MKUserLocation { return nil }
            if annotation is MKClusterAnnotation {
                return mapView.dequeueReusableAnnotationView(
                    withIdentifier: MKMapViewDefaultClusterAnnotationViewReuseIdentifier,
                    for: annotation
                )
            }
            guard let photoAnnotation = annotation as? PhotoAnnotation else { return nil }
            let view = mapView.dequeueReusableAnnotationView(
                withIdentifier: "photo",
                for: photoAnnotation
            ) as! PhotoPinView
            view.configure(with: photoAnnotation.photo)
            return view
        }

        func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
            mapView.deselectAnnotation(view.annotation, animated: false)
            if let a = view.annotation as? PhotoAnnotation {
                onSelect(a.photo)
            }
        }
    }
}

// MARK: - PhotoAnnotation

class PhotoAnnotation: NSObject, MKAnnotation {
    let photo: Photo
    dynamic var coordinate: CLLocationCoordinate2D
    var title: String? { nil }

    init?(photo: Photo) {
        guard let lat = photo.latitude, let lon = photo.longitude else { return nil }
        self.photo = photo
        self.coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }
}

// MARK: - PhotoPinView (circular thumbnail)

class PhotoPinView: MKAnnotationView {
    private let imageView = UIImageView()
    private var currentURL: URL?

    override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
        super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
        clusteringIdentifier = "photos"
        frame = CGRect(x: 0, y: 0, width: 44, height: 44)
        centerOffset = CGPoint(x: 0, y: -22)

        imageView.frame = bounds
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 22
        imageView.layer.borderColor = UIColor.white.cgColor
        imageView.layer.borderWidth = 2
        imageView.backgroundColor = UIColor.systemGray5
        addSubview(imageView)

        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOpacity = 0.35
        layer.shadowRadius = 3
        layer.shadowOffset = CGSize(width: 0, height: 2)
    }

    required init?(coder: NSCoder) { fatalError() }

    func configure(with photo: Photo) {
        guard let url = APIClient.shared.thumbnailURL(for: photo) else { return }
        guard url != currentURL else { return }
        currentURL = url
        imageView.image = nil
        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            guard let data, let image = UIImage(data: data) else { return }
            DispatchQueue.main.async { self?.imageView.image = image }
        }.resume()
    }
}

// MARK: - ClusterPinView (blue count badge)

class ClusterPinView: MKAnnotationView {
    private let circle = UIView()
    private let label = UILabel()

    override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
        super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)
        frame = CGRect(x: 0, y: 0, width: 40, height: 40)

        circle.frame = bounds
        circle.backgroundColor = UIColor.systemBlue
        circle.layer.cornerRadius = 20
        circle.layer.borderColor = UIColor.white.cgColor
        circle.layer.borderWidth = 2
        addSubview(circle)

        label.frame = bounds
        label.textAlignment = .center
        label.textColor = .white
        label.font = .systemFont(ofSize: 14, weight: .semibold)
        addSubview(label)

        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOpacity = 0.35
        layer.shadowRadius = 3
        layer.shadowOffset = CGSize(width: 0, height: 2)
    }

    required init?(coder: NSCoder) { fatalError() }

    override var annotation: MKAnnotation? {
        didSet {
            if let cluster = annotation as? MKClusterAnnotation {
                label.text = "\(cluster.memberAnnotations.count)"
            }
        }
    }
}
