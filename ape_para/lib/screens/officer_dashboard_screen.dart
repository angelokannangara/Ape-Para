/// Branch officer report filtering and status updates.
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/report.dart';
import '../providers/report_provider.dart';
import '../services/report_service.dart';
import '../widgets/report_card.dart';

class OfficerDashboardScreen extends StatefulWidget {
  const OfficerDashboardScreen({super.key});
  @override
  State<OfficerDashboardScreen> createState() => _OfficerDashboardScreenState();
}

class _OfficerDashboardScreenState extends State<OfficerDashboardScreen> {
  late Future<List<Report>> _reports = ReportService().fetchReportsForBranch('Colombo Municipal Council');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Officer dashboard')),
      body: FutureBuilder<List<Report>>(
        future: _reports,
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text(snapshot.error.toString()));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final reports = snapshot.data!;
          final open = reports.where((report) => report.status != 'Resolved' && report.status != 'Rejected').length;
          final resolvedToday = reports.where((report) => report.status == 'Resolved').length;
          if (reports.isEmpty) {
            return const Center(child: Text('No branch reports.'));
          }
          return ListView(
            padding: const EdgeInsets.all(12),
            children: [
              Text('Open: $open  |  Resolved: $resolvedToday'),
              const SizedBox(height: 8),
              ...reports.map((report) => ReportCard(
                report: report,
                trailing: Row(children: [
                  Expanded(child: DropdownButton<String>(
                    value: report.status,
                    items: const [
                      'Pending', 'Dispatched', 'In Progress', 'Resolved', 'Rejected',
                    ].map((value) => DropdownMenuItem(value: value, child: Text(value))).toList(),
                    onChanged: (value) async {
                      if (value != null) {
                        await context.read<ReportProvider>().updateStatus(report.id, value, '');
                        if (!mounted) return;
                        setState(() => _reports = ReportService().fetchReportsForBranch('Colombo Municipal Council'));
                      }
                    },
                  )),
                  IconButton(
                    tooltip: 'Copy dispatch email',
                    icon: const Icon(Icons.copy),
                    onPressed: () => Clipboard.setData(ClipboardData(
                      text: '${report.branchEmail}\n\n${report.reportId}\n${report.category}\n${report.description}',
                    )),
                  ),
                ]),
              )),
            ],
          );
        },
      ),
    );
  }
}
