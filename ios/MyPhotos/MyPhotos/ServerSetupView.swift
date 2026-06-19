import SwiftUI

struct ServerSetupView: View {
    @AppStorage("serverURL") private var serverURL: String = ""
    @State private var input = ""
    @State private var password = ""
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

                SecureField("Password (if required)", text: $password)
                    .textFieldStyle(.roundedBorder)
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
        APIClient.shared.pendingBaseURL = url

        do {
            let trimmedPassword = password.trimmingCharacters(in: .whitespaces)
            if !trimmedPassword.isEmpty {
                try await APIClient.shared.login(password: trimmedPassword)
            }
            _ = try await APIClient.shared.albums()
            APIClient.shared.pendingBaseURL = nil
            serverURL = url
        } catch let urlError as URLError where urlError.code == .userAuthenticationRequired {
            APIClient.shared.pendingBaseURL = nil
            self.error = "Wrong password or server requires one."
        } catch {
            APIClient.shared.pendingBaseURL = nil
            self.error = "Couldn't connect. Check the address and try again."
        }

        checking = false
    }
}
