import React from 'react';
import { render } from '@testing-library/react-native';
import SplashScreen from '../index';

describe('SplashScreen Component', () => {
  it('renders the application title in English and Hindi', () => {
    const { getByText } = render(<SplashScreen />);
    
    // Check that English title is rendered
    expect(getByText('Gahoi Sarthi')).toBeTruthy();
    
    // Check that Hindi title is rendered
    expect(getByText('गहोई सारथी')).toBeTruthy();
  });
});
