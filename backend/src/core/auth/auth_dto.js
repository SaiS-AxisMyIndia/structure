// AuthRequest / AuthResponse shapes

class RegisterRequestDto {
  constructor({ name, email, password }) {
    this.name = name;
    this.email = email;
    this.password = password;
  }
}

class LoginRequestDto {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
}

class AuthResponseDto {
  constructor({ user, accessToken, refreshToken }) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

module.exports = {
  RegisterRequestDto,
  LoginRequestDto,
  AuthResponseDto,
};
