import React, { Text } from 'react-native';

import { Slot, router, useGlobalSearchParams, usePathname } from '../exports';
import { Drawer } from '../layouts/Drawer';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { Redirect } from '../link/Link';
import { act, renderRouter, screen } from '../testing-library';

it('404', () => {
  renderRouter(
    {
      index: () => null,
    },
    {
      initialUrl: '/404',
    }
  );

  expect(screen.getByText('Unmatched Route')).toBeOnTheScreen();
  expect(screen).toHavePathname('/404');
  expect(screen).toHaveSegments(['+not-found']);
  expect(screen).toHaveSearchParams({ 'not-found': ['404'] });
});

it('can render a route', async () => {
  renderRouter({
    index: () => <Text>Hello</Text>,
  });

  expect(await screen.findByText('Hello')).toBeOnTheScreen();
  expect(screen).toHavePathname('/');
  expect(screen).toHaveSegments([]);
  expect(screen).toHaveSearchParams({});
});

describe('initialUrl', () => {
  /*
   * initialUrl sets the initial URL for the router.
   * This is not only useful for testing, but is critical for static rendering
   * which must set the initial URL for every page
   */
  it('can render with an initial URL', () => {
    renderRouter(
      {
        home: () => <Text>Hello</Text>,
      },
      {
        initialUrl: '/home',
      }
    );

    expect(screen.getByText('Hello')).toBeOnTheScreen();
    expect(screen).toHavePathname('/home');
    expect(screen).toHaveSegments(['home']);
    expect(screen).toHaveSearchParams({});
  });

  it('can render with an initial URL in a group', () => {
    renderRouter(
      {
        '(a)/home': () => <Text>Hello</Text>,
      },
      {
        initialUrl: '/home',
      }
    );

    expect(screen.getByText('Hello')).toBeOnTheScreen();
    expect(screen).toHavePathname('/home');
    expect(screen).toHaveSegments(['(a)', 'home']);
    expect(screen).toHaveSearchParams({});
  });

  it('can render with an index initial URL in a group', () => {
    renderRouter(
      {
        '(a)/index': () => <Text>Hello</Text>,
      },
      {
        initialUrl: '/',
      }
    );

    expect(screen.getByText('Hello')).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments(['(a)']);
    expect(screen).toHaveSearchParams({});
  });

  it('will render the correct group', () => {
    renderRouter(
      {
        '(a)/index': () => <Text>Hello</Text>,
        '(b)/index': () => <Text>World</Text>,
      },
      {
        initialUrl: '/(b)',
      }
    );

    expect(screen.getByText('World')).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSegments(['(b)']);
    expect(screen).toHaveSearchParams({});
  });
});

it('can handle dynamic routes', async () => {
  renderRouter(
    {
      '[slug]': function Path() {
        const { slug } = useGlobalSearchParams();
        return <Text>{slug}</Text>;
      },
    },
    {
      initialUrl: '/test-path',
    }
  );

  expect(await screen.findByText('test-path')).toBeOnTheScreen();

  expect(screen).toHavePathname('/test-path');
  expect(screen).toHaveSegments(['[slug]']);
  expect(screen).toHaveSearchParams({
    slug: 'test-path',
  });
});

it('does not rerender routes', async () => {
  const Index = jest.fn(() => <Text>Screen</Text>);

  renderRouter({
    index: Index,
  });

  expect(await screen.findByText('Screen')).toBeOnTheScreen();
  expect(Index).toHaveBeenCalledTimes(1);
});

it('redirects', async () => {
  const Index = jest.fn(() => <Redirect href="/other" />);
  const Other = jest.fn(() => <Text>Other</Text>);

  renderRouter({
    '(app)/index': Index,
    '(app)/other': Other,
  });

  expect(await screen.findByText('Other')).toBeOnTheScreen();
  expect(Index).toHaveBeenCalledTimes(1);
  expect(Other).toHaveBeenCalledTimes(1);
});

it('layouts', async () => {
  const Layout = jest.fn(() => <Slot />);
  const Index = jest.fn(() => <Redirect href="/other" />);
  const Other = jest.fn(() => <Text>Other</Text>);

  renderRouter({
    '(app)/_layout': Layout,
    '(app)/index': Index,
    '(app)/other': Other,
  });

  expect(await screen.findByText('Other')).toBeOnTheScreen();
  expect(Layout).toHaveBeenCalledTimes(1);
  expect(Index).toHaveBeenCalledTimes(1);
  expect(Other).toHaveBeenCalledTimes(1);
});

it('nested layouts', async () => {
  const RootLayout = jest.fn(() => <Slot />);
  const AppLayout = jest.fn(() => <Slot />);
  const TabsLayout = jest.fn(() => <Tabs />);
  const StackLayout = jest.fn(() => <Stack />);

  const Index = jest.fn(() => <Redirect href="/home" />);
  const Home = jest.fn(() => <Redirect href="/home/nested" />);
  const HomeNested = jest.fn(() => <Text>HomeNested</Text>);

  renderRouter({
    _layout: RootLayout,
    '(app)/_layout': AppLayout,
    '(app)/index': Index,
    '(app)/(tabs)/_layout': TabsLayout,
    '(app)/(tabs)/home/_layout': StackLayout,
    '(app)/(tabs)/home/index': Home,
    '(app)/(tabs)/home/nested': HomeNested,
  });

  expect(await screen.findByText('HomeNested')).toBeOnTheScreen();

  expect(AppLayout).toHaveBeenCalledTimes(1);
  expect(TabsLayout).toHaveBeenCalledTimes(2);
  expect(StackLayout).toHaveBeenCalledTimes(2);
  expect(Index).toHaveBeenCalledTimes(1);
  expect(Home).toHaveBeenCalledTimes(1);
  expect(HomeNested).toHaveBeenCalledTimes(1);
});

it('deep linking nested groups', async () => {
  const RootLayout = jest.fn(() => <Slot />);
  const AppLayout = jest.fn(() => <Stack />);
  const TabsLayout = jest.fn(() => <Tabs />);
  const HomeLayout = jest.fn(() => <Stack />);

  const Home = jest.fn(() => <Text testID="Home" />);

  const OtherTabsLayout = jest.fn(() => <Stack />);
  const NestedTabsLayout = jest.fn(() => <Tabs />);
  const OtherTabsIndex = jest.fn(() => <Text testID="OtherTabsHome" />);

  renderRouter(
    {
      _layout: RootLayout,
      '(app)/_layout': AppLayout,
      '(app)/(tabs)/_layout': TabsLayout,
      '(app)/(tabs)/home/_layout': HomeLayout,
      '(app)/(tabs)/home/index': Home,
      '(app)/(other_tabs)/_layout': OtherTabsLayout,
      '(app)/(other_tabs)/(nested_tabs)/_layout': NestedTabsLayout,
      '(app)/(other_tabs)/(nested_tabs)/home/index': OtherTabsIndex,
    },
    {
      initialUrl: '/(app)/(other_tabs)/(nested_tabs)/home',
    }
  );

  // Start in a deeply nested navigator
  expect(screen.getByTestId('OtherTabsHome')).toBeOnTheScreen();

  act(() => router.replace('/(app)/(tabs)/home'));

  expect(screen.getByTestId('Home')).toBeOnTheScreen();

  expect(RootLayout).toHaveBeenCalledTimes(1);
  expect(AppLayout).toHaveBeenCalledTimes(1);
  expect(TabsLayout).toHaveBeenCalledTimes(1);
  expect(HomeLayout).toHaveBeenCalledTimes(1);
  expect(OtherTabsLayout).toHaveBeenCalledTimes(1);
  expect(NestedTabsLayout).toHaveBeenCalledTimes(1);
  expect(OtherTabsIndex).toHaveBeenCalledTimes(1);
});

// Skipped due to 0.74.0-rc.2 regression.
// react-native-gesture-handler is failing in Fabric.
// https://exponent-internal.slack.com/archives/C0447EFTS74/p1709588600921339?thread_ts=1709578927.565339&cid=C0447EFTS74
// Please enable once `react-native-gesture-handler` is updated
it.skip('can navigate across the drawer navigator', () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
    '(group)/_layout': () => <Drawer />,
    '(group)/one': () => <Text testID="one" />,
    '(group)/two': () => <Text testID="two" />,
    '(group_two)/three': () => <Text testID="three" />,
    '(group_two)/_layout': () => <Drawer />,
    '(group_two)/nested/folder/_layout': () => <Drawer />,
    '(group_two)/nested/folder/four': () => <Text testID="four" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  // Navigate to a drawer screen
  act(() => router.push('/one'));
  expect(screen).toHavePathname('/one');
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  // Navigate within the drawer
  act(() => router.push('/two'));
  expect(screen).toHavePathname('/two');
  expect(screen.getByTestId('two')).toBeOnTheScreen();

  // Navigate to a different drawer
  act(() => router.push('/three'));
  expect(screen).toHavePathname('/three');
  expect(screen.getByTestId('three')).toBeOnTheScreen();

  // Navigate to a nested folder
  act(() => router.push('/nested/folder/four'));
  expect(screen).toHavePathname('/nested/folder/four');
  expect(screen.getByTestId('four')).toBeOnTheScreen();

  // Navigate back to one
  act(() => router.push('/one'));
  expect(screen).toHavePathname('/one');
  expect(screen.getByTestId('one')).toBeOnTheScreen();
});

it('can redirect during the initial render', () => {
  renderRouter({
    _layout: function Layout() {
      const pathName = usePathname();

      if (pathName === '/') {
        return <Redirect href="/test" />;
      }

      return <Stack />;
    },
    '/test/_layout': function TestLayout() {
      return <Stack />;
    },
    '/test/index': () => <Text testID="test">test</Text>,
  });

  expect(screen).toHavePathname('/test');
  expect(screen.getByTestId('test')).toBeOnTheScreen();
});

it('will pick a static route over the dynamic route in the same group', () => {
  const A = jest.fn(() => <Text>Index</Text>);
  const B = jest.fn(() => <Text>Dynamic</Text>);

  renderRouter({
    _layout: () => <Stack />,
    'messages/[id]': A,

    // Starting route is inside a group
    '(group)/index': () => null,
    '(group)/[type]/[id]': B,
  });

  act(() => router.push('/messages/1'));

  expect(A).toHaveBeenCalled();
  expect(B).not.toHaveBeenCalled();
});
