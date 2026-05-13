import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemedText } from '../themed-text';

jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn(() => '#111111'),
}));

describe('ThemedText', () => {
  it('renders children', () => {
    render(<ThemedText>Hello campus</ThemedText>);
    expect(screen.getByText('Hello campus')).toBeTruthy();
  });

  it('applies title style when type is title', () => {
    render(<ThemedText type="title">Title</ThemedText>);
    const node = screen.getByText('Title');
    const flat = StyleSheet.flatten(node.props.style);
    expect(flat.fontSize).toBe(32);
  });
});
