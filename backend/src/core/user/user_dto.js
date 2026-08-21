class UserResponseDto {
  constructor({ id, name, email, role }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
  }
}

class UpdateUserRequestDto {
  constructor({ name, email }) {
    this.name = name;
    this.email = email;
  }
}

module.exports = {
  UserResponseDto,
  UpdateUserRequestDto,
};
