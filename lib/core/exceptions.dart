/// User-facing application exceptions.
class AppException implements Exception {
  final String message;
  const AppException(this.message);

  @override
  String toString() => message;
}
