/// Home report submission screen.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/report_provider.dart';
import '../widgets/location_picker.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _description = TextEditingController();
  final _address = TextEditingController();
  String _category = 'Electrical/CEB';
  XFile? _image;
  double _lat = 6.9271;
  double _lng = 79.8612;
  String? _trackingId;

  @override
  void dispose() {
    _description.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _pick() async {
    final image = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85);
    if (image != null) {
      if ((await image.length()) > 8 * 1024 * 1024) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Photo must be no larger than 8 MB.')));
        return;
      }
      setState(() => _image = image);
    }
  }

  Future<void> _submit() async {
    if (_image == null || _description.text.trim().length < 5) return;
    final bytes = await _image!.readAsBytes();
    final trackingId = await context.read<ReportProvider>().submit(
      image: bytes, imageName: _image!.name, category: _category,
      description: _description.text.trim(), lng: _lng, lat: _lat,
      addressText: _address.text.trim(),
    );
    if (trackingId != null && mounted) {
      setState(() => _trackingId = trackingId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('අපේ පාර'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'logout') context.read<AuthProvider>().signOut();
              if (value == 'dashboard') context.go('/dashboard');
            },
            itemBuilder: (_) => [
              if (context.read<AuthProvider>().profile?.role != 'citizen')
                const PopupMenuItem(value: 'dashboard', child: Text('Officer dashboard')),
              const PopupMenuItem(value: 'logout', child: Text('Sign out')),
            ],
          ),
        ],
      ),
      drawer: Drawer(child: ListView(children: [
        const DrawerHeader(child: Text('අපේ පාර', style: TextStyle(fontSize: 24))),
        ListTile(title: const Text('Submit report'), onTap: () => context.go('/')),
        ListTile(title: const Text('My reports'), onTap: () => context.go('/my-reports')),
        ListTile(title: const Text('Nearby reports'), onTap: () => context.go('/nearby')),
        ListTile(title: const Text('Map'), onTap: () => context.go('/map')),
      ])),
      body: Center(child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 640),
        child: ListView(padding: const EdgeInsets.all(16), children: [
          if (_trackingId != null)
            Card(color: Colors.green.shade50, child: ListTile(
              title: Text('Report submitted: $_trackingId'),
              subtitle: const Text('Your report has been routed. An officer will update its progress.'),
            )),
          FilledButton.icon(
            onPressed: _pick, icon: const Icon(Icons.camera_alt),
            label: Text(_image == null ? 'Add photo' : 'Photo selected'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
            items: const [
              'Electrical/CEB', 'Water/NWSB', 'Road/RDA', 'Municipal/MC', 'Waste',
            ].map((value) => DropdownMenuItem(value: value, child: Text(value))).toList(),
            onChanged: (value) => setState(() => _category = value!),
          ),
          const SizedBox(height: 12),
          TextField(controller: _description, maxLines: 4,
            decoration: const InputDecoration(labelText: 'Description (5-1000 characters)', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          TextField(controller: _address,
              decoration: const InputDecoration(labelText: 'Address (optional)', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          LocationPicker(onLatitude: (value) => _lat = value, onLongitude: (value) => _lng = value),
          const SizedBox(height: 16),
          if (provider.error != null) Text(provider.error!, style: const TextStyle(color: Colors.red)),
          FilledButton(
            onPressed: provider.loading ? null : _submit,
            child: Text(provider.loading ? 'Submitting...' : 'Submit report'),
          ),
        ]),
      )),
    );
  }
}
