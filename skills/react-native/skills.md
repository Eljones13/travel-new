# React Native Best Practices Skill
This skill ensures the app survives the "Ravers Paradox" (extreme network/hardware stress).

- [cite_start]**Performance**: Use FlashList for long packing lists to avoid frame drops[cite: 300, 379].
- [cite_start]**Bundle Size**: Minimize external dependencies to ensure fast loading on "burner" phones[cite: 347, 348].
- [cite_start]**Offline Logic**: Use WatermelonDB transactions for all writes to prevent data corruption during power loss[cite: 88, 377].
- **UI**: Zero network spinners allowed. [cite_start]UI must read/write to local SQLite instantly[cite: 34, 35, 49].