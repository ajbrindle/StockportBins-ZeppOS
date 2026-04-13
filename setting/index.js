AppSettingsPage({
  build(props) {
    return View(
      {
        style: {
          padding: '20px',
        },
      },
      [
        TextInput({
          label: 'Enter your Area ID',
          settingsKey: 'areaId',
          placeholder: 'e.g. 12345',
        }),
      ]
    );
  },
});