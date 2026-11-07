/// Status badge with consistent report colours.
import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'Dispatched' => Colors.orange,
      'In Progress' => Colors.amber.shade700,
      'Resolved' => Colors.green,
      'Rejected' => Colors.grey,
      _ => Colors.red,
    };
    return Chip(
      label: Text(status, style: const TextStyle(color: Colors.white)),
      backgroundColor: color,
      visualDensity: VisualDensity.compact,
    );
  }
}
