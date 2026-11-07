/// Reusable report summary card.
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/report.dart';
import 'status_badge.dart';

class ReportCard extends StatelessWidget {
  final Report report;
  final Widget? trailing;
  const ReportCard({super.key, required this.report, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(report.reportId, style: Theme.of(context).textTheme.titleMedium)),
            StatusBadge(status: report.status),
          ]),
          Text(report.category),
          const SizedBox(height: 8),
          Text(report.description),
          const SizedBox(height: 8),
          Text(DateFormat.yMMMd().add_jm().format(report.createdAt)),
          if (trailing != null) ...[const SizedBox(height: 8), trailing!],
        ]),
      ),
    );
  }
}
