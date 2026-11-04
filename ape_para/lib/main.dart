import 'package:flutter_map/flutter_map.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth/auth_gate.dart';
import 'auth/auth_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  if (supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty) {
    await Supabase.initialize(
      url: supabaseUrl,
      publishableKey: supabaseAnonKey,
    );
  }

  runApp(const ApeParaApp());
}

// ---------------------------------------------------------------------------
// Design tokens
// Deep monsoon-teal ink, road-marking yellow as the single accent,
// and status colours that always mean the same thing.
// ---------------------------------------------------------------------------
class AppColors {
  static const ink = Color(0xFF12303B);
  static const roadYellow = Color(0xFFFFC20E);
  static const surface = Color(0xFFF2F5F5);
  static const submitted = Color(0xFF6B7C85);
  static const forwarded = Color(0xFFD9822B);
  static const inProgress = Color(0xFF2A6FDB);
  static const resolved = Color(0xFF2F8F5B);
}

class ApeParaApp extends StatelessWidget {
  const ApeParaApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Atkinson Hyperlegible is built for readability. Sinhala and Tamil
    // glyphs fall back to the device fonts (Noto on most Android phones).
    final base = ThemeData(useMaterial3: true);
    return MaterialApp(
      title: 'Ape Para',
      debugShowCheckedModeBanner: false,
      theme: base.copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.ink,
          primary: AppColors.ink,
          secondary: AppColors.roadYellow,
        ),
        scaffoldBackgroundColor: AppColors.surface,
        textTheme: GoogleFonts.atkinsonHyperlegibleTextTheme(base.textTheme),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.surface,
          foregroundColor: AppColors.ink,
          elevation: 0,
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.ink,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ),
      home: const AuthGate(),
    );
  }
}

// ---------------------------------------------------------------------------
// Models (mock data; replace with your backend)
// ---------------------------------------------------------------------------
enum IssueCategory {
  pothole,
  streetLight,
  drainage,
  waterSupply,
  garbage,
  other,
}

extension IssueCategoryInfo on IssueCategory {
  String get label => switch (this) {
    IssueCategory.pothole => 'Pothole',
    IssueCategory.streetLight => 'Street light',
    IssueCategory.drainage => 'Drainage',
    IssueCategory.waterSupply => 'Water supply',
    IssueCategory.garbage => 'Garbage',
    IssueCategory.other => 'Other',
  };

  IconData get icon => switch (this) {
    IssueCategory.pothole => Icons.add_road,
    IssueCategory.streetLight => Icons.lightbulb_outline,
    IssueCategory.drainage => Icons.water_drop_outlined,
    IssueCategory.waterSupply => Icons.plumbing,
    IssueCategory.garbage => Icons.delete_outline,
    IssueCategory.other => Icons.report_problem_outlined,
  };

  /// Placeholder for the real routing logic (GPS -> council boundary + category).
  String get authority => switch (this) {
    IssueCategory.pothole => 'Local council or RDA',
    IssueCategory.streetLight => 'Local council',
    IssueCategory.drainage => 'Local council',
    IssueCategory.waterSupply => 'NWSDB',
    IssueCategory.garbage => 'Local council',
    IssueCategory.other => 'Local council',
  };
}

enum ReportStatus { submitted, forwarded, inProgress, resolved }

extension ReportStatusInfo on ReportStatus {
  String get label => switch (this) {
    ReportStatus.submitted => 'Submitted',
    ReportStatus.forwarded => 'Forwarded',
    ReportStatus.inProgress => 'In progress',
    ReportStatus.resolved => 'Resolved',
  };

  Color get color => switch (this) {
    ReportStatus.submitted => AppColors.submitted,
    ReportStatus.forwarded => AppColors.forwarded,
    ReportStatus.inProgress => AppColors.inProgress,
    ReportStatus.resolved => AppColors.resolved,
  };
}

class Report {
  final String title;
  final String place;
  final IssueCategory category;
  final ReportStatus status;
  final String sentTo;
  final int supporters;
  final int daysAgo;

  const Report({
    required this.title,
    required this.place,
    required this.category,
    required this.status,
    required this.sentTo,
    required this.supporters,
    required this.daysAgo,
  });
}

const sampleReports = <Report>[
  Report(
    title: 'Deep pothole near the bus halt',
    place: 'Colombo Road, Negombo',
    category: IssueCategory.pothole,
    status: ReportStatus.forwarded,
    sentTo: 'Negombo Municipal Council',
    supporters: 24,
    daysAgo: 3,
  ),
  Report(
    title: 'Street light out for two weeks',
    place: 'Lewis Place, Negombo',
    category: IssueCategory.streetLight,
    status: ReportStatus.inProgress,
    sentTo: 'Negombo Municipal Council',
    supporters: 11,
    daysAgo: 9,
  ),
  Report(
    title: 'Drain blocked, water on the road',
    place: 'Beach Road, Negombo',
    category: IssueCategory.drainage,
    status: ReportStatus.submitted,
    sentTo: 'Not yet forwarded',
    supporters: 6,
    daysAgo: 1,
  ),
  Report(
    title: 'Burst water pipe by the junction',
    place: 'Kurana Junction',
    category: IssueCategory.waterSupply,
    status: ReportStatus.resolved,
    sentTo: 'NWSDB',
    supporters: 38,
    daysAgo: 14,
  ),
];

// ---------------------------------------------------------------------------
// Login: phone number then OTP
// ---------------------------------------------------------------------------
class DemoLoginScreen extends StatefulWidget {
  const DemoLoginScreen({super.key});

  @override
  State<DemoLoginScreen> createState() => _DemoLoginScreenState();
}

class _DemoLoginScreenState extends State<DemoLoginScreen> {
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  bool _codeSent = false;

  @override
  void dispose() {
    _phone.dispose();
    _otp.dispose();
    super.dispose();
  }

  void _continue() {
    if (!_codeSent) {
      setState(() => _codeSent = true);
    } else {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const HomeShell()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Container(
                width: 56,
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.roadYellow,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Ape Para',
                style: text.displaySmall?.copyWith(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Report a problem on your road. We send it to the right office.',
                style: text.bodyLarge,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _phone,
                enabled: !_codeSent,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Mobile number',
                  prefixText: '+94  ',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              if (_codeSent) ...[
                const SizedBox(height: 16),
                TextField(
                  controller: _otp,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  decoration: const InputDecoration(
                    labelText: '6-digit code',
                    helperText: 'We sent a code by SMS',
                    border: OutlineInputBorder(),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _continue,
                child: Text(_codeSent ? 'Verify and continue' : 'Send code'),
              ),
              const Spacer(flex: 2),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// App shell: bottom navigation plus the primary "Report" action
// ---------------------------------------------------------------------------
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  Future<void> _openReportFlow() async {
    final sent = await Navigator.of(context).push<IssueCategory>(
      MaterialPageRoute(builder: (_) => const ReportScreen()),
    );
    if (sent != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Report sent to ${sent.authority}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const pages = [FeedScreen(), MapScreen(), ProfileScreen()];
    return Scaffold(
      body: SafeArea(
        child: IndexedStack(index: _index, children: pages),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openReportFlow,
        backgroundColor: AppColors.roadYellow,
        foregroundColor: AppColors.ink,
        icon: const Icon(Icons.add_a_photo_outlined),
        label: const Text(
          'Report a problem',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.list_alt), label: 'Reports'),
          NavigationDestination(icon: Icon(Icons.map_outlined), label: 'Map'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Me'),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Feed: reports near you, filterable by category
// ---------------------------------------------------------------------------
class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  IssueCategory? _filter;

  @override
  Widget build(BuildContext context) {
    final reports = sampleReports
        .where((r) => _filter == null || r.category == _filter)
        .toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      children: [
        Text(
          'Near you',
          style: Theme.of(context).textTheme.headlineSmall
              ?.copyWith(fontWeight: FontWeight.w700, color: AppColors.ink),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: const Text('All'),
                  selected: _filter == null,
                  onSelected: (_) => setState(() => _filter = null),
                ),
              ),
              for (final c in IssueCategory.values)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    avatar: Icon(c.icon, size: 18),
                    label: Text(c.label),
                    selected: _filter == c,
                    onSelected: (_) => setState(() => _filter = c),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (reports.isEmpty)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Center(
              child: Text(
                'No reports in this category yet. Be the first to report one.',
              ),
            ),
          ),
        for (final r in reports) ReportCard(report: r),
      ],
    );
  }
}

class ReportCard extends StatefulWidget {
  final Report report;
  const ReportCard({super.key, required this.report});

  @override
  State<ReportCard> createState() => _ReportCardState();
}

class _ReportCardState extends State<ReportCard> {
  bool _supported = false;

  @override
  Widget build(BuildContext context) {
    final r = widget.report;
    final text = Theme.of(context).textTheme;
    final count = r.supporters + (_supported ? 1 : 0);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // The coloured edge is the status: same colour = same stage everywhere.
            Container(width: 6, color: r.status.color),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(r.category.icon, size: 20, color: AppColors.ink),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            r.title,
                            style: text.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${r.place}  •  ${r.daysAgo}d ago',
                      style: text.bodyMedium,
                    ),
                    const SizedBox(height: 4),
                    Text('Sent to: ${r.sentTo}', style: text.bodySmall),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Text(
                          r.status.label,
                          style: text.labelLarge?.copyWith(
                            color: r.status.color,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        OutlinedButton.icon(
                          onPressed: () =>
                              setState(() => _supported = !_supported),
                          icon: Icon(
                            _supported
                                ? Icons.thumb_up
                                : Icons.thumb_up_outlined,
                            size: 16,
                          ),
                          label: Text('I have this too  $count'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Report flow: category, photo, location, details
// ---------------------------------------------------------------------------
class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  IssueCategory? _category;
  final _details = TextEditingController();
  bool _hasPhoto = false;
  final _imagePicker = ImagePicker();
  Position? _position;
  bool _findingLocation = false;

  @override
  void dispose() {
    _details.dispose();
    super.dispose();
  }

  Future<void> _addPhoto() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Take a photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from gallery'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;

    final photo = await _imagePicker.pickImage(
      source: source,
      maxWidth: 1600,
      imageQuality: 85,
    );
    if (!mounted || photo == null) return;
    setState(() => _hasPhoto = true);
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _findingLocation = true);
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw const LocationServiceDisabledException();
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('Location permission denied');
      }

      final position = await Geolocator.getCurrentPosition();
      if (mounted) setState(() => _position = position);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) setState(() => _findingLocation = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final canSubmit = _category != null && _hasPhoto;

    return Scaffold(
      appBar: AppBar(title: const Text('Report a problem')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'What is the problem?',
            style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            children: [
              for (final c in IssueCategory.values)
                _CategoryTile(
                  category: c,
                  selected: _category == c,
                  onTap: () => setState(() => _category = c),
                ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Add a photo',
            style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          InkWell(
            onTap: _addPhoto,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 140,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: _hasPhoto ? AppColors.resolved : Colors.black26,
                  width: _hasPhoto ? 2 : 1,
                ),
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _hasPhoto
                          ? Icons.check_circle_outline
                          : Icons.camera_alt_outlined,
                      size: 32,
                      color: _hasPhoto ? AppColors.resolved : AppColors.ink,
                    ),
                    const SizedBox(height: 8),
                    Text(_hasPhoto ? 'Photo added' : 'Take or choose a photo'),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Where is it?',
            style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.my_location, color: AppColors.ink),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _position == null
                        ? 'Location not added yet'
                        : '${_position!.latitude.toStringAsFixed(5)}, '
                              '${_position!.longitude.toStringAsFixed(5)}',
                  ),
                ),
                TextButton(
                  onPressed: _findingLocation ? null : _useCurrentLocation,
                  child: Text(_findingLocation ? 'Finding...' : 'Use location'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Details (optional)',
            style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _details,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Anything that helps the officer find or fix it',
              border: OutlineInputBorder(),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          if (_category != null) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.send_outlined, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('This will be sent to: ${_category!.authority}'),
                ),
              ],
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: canSubmit
                ? () => Navigator.of(context).pop(_category)
                : null,
            child: const Text('Send report'),
          ),
          if (!canSubmit)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text(
                'Choose a problem type and add a photo to send.',
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  final IssueCategory category;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryTile({
    required this.category,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : Colors.white,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              category.icon,
              size: 30,
              color: selected ? AppColors.roadYellow : AppColors.ink,
            ),
            const SizedBox(height: 8),
            Text(
              category.label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: selected ? Colors.white : AppColors.ink,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Map and profile (stubs to build out next)
// ---------------------------------------------------------------------------
class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final markers = <Marker>[
      Marker(
        point: const LatLng(7.2083, 79.8358),
        width: 40,
        height: 40,
        child: const Icon(Icons.location_pin, size: 40, color: Colors.blue),
      ),
      Marker(
        point: const LatLng(7.2115, 79.8410),
        width: 40,
        height: 40,
        child: const Icon(Icons.location_pin, size: 40, color: Colors.orange),
      ),
      Marker(
        point: const LatLng(7.2030, 79.8314),
        width: 40,
        height: 40,
        child: const Icon(Icons.location_pin, size: 40, color: Colors.green),
      ),
    ];

    return FlutterMap(
      options: const MapOptions(
        initialCenter: LatLng(7.2083, 79.8358),
        initialZoom: 14,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.example.ape_para',
        ),
        MarkerLayer(markers: markers),
      ],
    );
  }
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _lang = 'en';

  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text('You will need to sign in again to report issues.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    try {
      await AuthService().signOut();
    } catch (_) {
      // Demo mode and already signed-out Supabase sessions can both reach here.
    }

    if (!mounted || AuthGate.isConfigured) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const DemoLoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Language',
          style: Theme.of(context).textTheme.titleMedium
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'si', label: Text('සිංහල')),
            ButtonSegment(value: 'ta', label: Text('தமிழ்')),
            ButtonSegment(value: 'en', label: Text('English')),
          ],
          selected: {_lang},
          // TODO: wire to flutter_localizations / ARB files
          onSelectionChanged: (s) => setState(() => _lang = s.first),
        ),
        const SizedBox(height: 24),
        const ListTile(leading: Icon(Icons.history), title: Text('My reports')),
        const ListTile(
          leading: Icon(Icons.notifications_none),
          title: Text('Notifications'),
        ),
        ListTile(
          leading: const Icon(Icons.logout),
          title: const Text('Sign out'),
          onTap: _signOut,
        ),
      ],
    );
  }
}
