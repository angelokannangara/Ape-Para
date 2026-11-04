/// Location control with browser geolocation and manual fallback.
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

class LocationPicker extends StatefulWidget {
  final ValueChanged<double> onLatitude;
  final ValueChanged<double> onLongitude;
  const LocationPicker({super.key, required this.onLatitude, required this.onLongitude});

  @override
  State<LocationPicker> createState() => _LocationPickerState();
}

class _LocationPickerState extends State<LocationPicker> {
  final _lat = TextEditingController(text: '6.9271');
  final _lng = TextEditingController(text: '79.8612');
  bool _loading = false;

  Future<void> _locate() async {
    setState(() => _loading = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever ||
          permission == LocationPermission.denied) {
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      _lat.text = position.latitude.toString();
      _lng.text = position.longitude.toString();
      widget.onLatitude(position.latitude);
      widget.onLongitude(position.longitude);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _update() {
    widget.onLatitude(double.tryParse(_lat.text) ?? 0);
    widget.onLongitude(double.tryParse(_lng.text) ?? 0);
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      FilledButton.tonalIcon(
        onPressed: _loading ? null : _locate,
        icon: const Icon(Icons.my_location),
        label: Text(_loading ? 'Locating...' : 'Use current location'),
      ),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: TextField(controller: _lat, keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Latitude', border: OutlineInputBorder()),
            onChanged: (_) => _update())),
        const SizedBox(width: 8),
        Expanded(child: TextField(controller: _lng, keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Longitude', border: OutlineInputBorder()),
            onChanged: (_) => _update())),
      ]),
    ]);
  }
}
