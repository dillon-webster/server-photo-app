import SwiftUI

struct ServerSetupView: View {
    @AppStorage("serverURL") private var serverURL: String = ""
    @State private var input = ""
    @State private var checking = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 40) {
            Spacer()

            VStack(spacing: 12) {
                Image(systemName: "photo.on.rectangle.angled")
                    .font(.system(size: 64))
                    .foregroundStyle(.tint)
                Text("MyPhotos")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                Text("Enter your server address to get started.")
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(alignment: .leading, spacing: 8) {
                TextField("http://192.168.1.100:3002", text: $input)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.URL)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .onSubmit { Task { await connect() } }

                if let err = error {
                    Text(err)
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }

            Button {
                Task { await connect() }
            } label: {
                Group {
                    if checking {
                        ProgressView().tint(.white)
                    } else {
                        Text("Connect").fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
            }
            .buttonStyle(.borderedProminent)
            .disabled(input.trimmingCharacters(in: .whitespaces).isEmpty || checking)

            Spacer()
        }
        .padding(32)
    }

    private func connect() async {
        var url = input.trimmingCharacters(in: .whitespaces)
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        if !url.hasPrefix("http://") && !url.hasPrefix("https://") {
            url = "http://" + url
        }

        checking = true
        error = nil

        UserDefaults.standard.set(url, forKey: "serverURL")
        do {
            _ = try await APIClient.shared.albums()
            serverURL = url
        } catch {
            UserDefaults.standard.removeObject(forKey: "serverURL")
            self.error = "Couldn't connect. Check the address and try again."
        }

        checking = false
    }
}
