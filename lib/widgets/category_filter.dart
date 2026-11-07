/// Category filter used on citizen report feeds.
import 'package:flutter/material.dart';

class CategoryFilter extends StatelessWidget {
  final String value;
  final ValueChanged<String?> onChanged;
  const CategoryFilter({super.key, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
      items: const [
        DropdownMenuItem(value: 'All', child: Text('All categories')),
        DropdownMenuItem(value: 'Electrical/CEB', child: Text('Electrical/CEB')),
        DropdownMenuItem(value: 'Water/NWSB', child: Text('Water/NWSB')),
        DropdownMenuItem(value: 'Road/RDA', child: Text('Road/RDA')),
        DropdownMenuItem(value: 'Municipal/MC', child: Text('Municipal/MC')),
        DropdownMenuItem(value: 'Waste', child: Text('Waste')),
      ],
      onChanged: onChanged,
    );
  }
}
