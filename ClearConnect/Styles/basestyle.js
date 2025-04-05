const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5dc',
      borderColor: '#000',
      borderWidth: 2,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    button: {
      backgroundColor: '#003366',
      paddingVertical: 0.05 * height,
      paddingHorizontal: 0.1 * width,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 10,
      borderColor: '#000',
      borderWidth: 2,
    },
    buttonText: {
      color: '#f5f5dc',
      fontSize: Math.min(baseFontSize, 18),
      fontWeight: 'bold',
    },
  });
  