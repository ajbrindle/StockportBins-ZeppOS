AppSettingsPage({
  build(props) {
    return View(
      {
        style: {
          padding: '20px',
          // Force the entire page to stack items vertically
          display: 'flex',
          flexDirection: 'column'
        },
      },
      [
        // The Instructions Header
        Text({ bold: true, style: { fontSize: '18px', marginBottom: '10px' } }, 'How to find your Stockport area ID:'),
        
        // The Step-by-Step Guide
        Text({ style: { fontSize: '14px', marginBottom: '5px' } }, '1. Visit: stockport.gov.uk/find-your-collection-day'),
        Text({ style: { fontSize: '14px', marginBottom: '5px' } }, '2. Enter your address and click through to the collection dates page.'),
        Text({ style: { fontSize: '14px', marginBottom: '5px' } }, '3. Look at the URL in your browser address bar.'),
        Text({ style: { fontSize: '14px', marginBottom: '15px' } }, '4. Your ID is the number located between the slashes after "show/".'),

        // The Visual Example
        Text({ style: { fontSize: '13px', color: '#666666' } }, 'Example URL:'),
        Text({ style: { fontSize: '13px', color: '#666666', marginTop: '4px' } }, '.../show/100011526336/39ROADNAME...'),
        Text({ style: { fontSize: '13px', color: '#666666', marginTop: '10px', marginBottom: '20px' } }, 'Your Area ID would be: 100011526336'),

        // The Input Field Wrapper
        View(
          {
            style: {
              border: '1px solid #cccccc',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa',
              marginTop: '10px',
              padding: '5px',
              // Force this inner wrapper to behave as a flex container
              display: 'flex',
              flexDirection: 'column' 
            }
          },
          [
            TextInput({
              label: 'Stockport MBC Area ID',
              settingsKey: 'areaId',
              placeholder: 'e.g., 100011526336'
            })
          ]
        )
      ]
    )
  }
})