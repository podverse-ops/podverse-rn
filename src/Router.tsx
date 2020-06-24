import { Image, View } from 'react-native'
import { createAppContainer, createSwitchNavigator } from 'react-navigation'
import { createStackNavigator, NavigationStackOptions } from 'react-navigation-stack'
import { createBottomTabNavigator } from 'react-navigation-tabs'
import React, { getGlobal } from 'reactn'
import { DownloadsActiveBadge, NavSearchIcon, PVTabBar, TabBarLabel } from './components'
import { PV } from './resources'
import {
  AboutScreen,
  AddPodcastByRSSScreen,
  AuthScreen,
  ClipsScreen,
  DownloadsScreen,
  EditPlaylistScreen,
  EditProfileScreen,
  EmailVerificationScreen,
  EpisodeScreen,
  EpisodesScreen,
  FAQScreen,
  MakeClipScreen,
  MembershipScreen,
  MoreScreen,
  OnboardingScreen,
  PlayerScreen,
  PlaylistsAddToScreen,
  PlaylistScreen,
  PlaylistsScreen,
  PodcastScreen,
  PodcastsScreen,
  ProfileScreen,
  ProfilesScreen,
  PurchasingScreen,
  QueueScreen,
  ScanQRCodeScreen,
  SearchScreen,
  SettingsScreen,
  SleepTimerScreen,
  TermsOfServiceScreen,
  WebPageScreen
} from './screens'
import { darkTheme } from './styles'

const tabTestProps = (id: string) => {
  return { tabBarTestID: id, tabBarAccessibilityLabel: id }
}

const defaultNavigationOptions = ({ navigation }) => {
  const { fontScale, fontScaleMode } = getGlobal()

  let fontSize = PV.Fonts.sizes.xl
  if (fontScaleMode === PV.Fonts.fontScale.larger) {
    fontSize = PV.Fonts.largeSizes.xl * fontScale
  } else if (fontScaleMode === PV.Fonts.fontScale.largest) {
    fontSize = PV.Fonts.largeSizes.md * fontScale
  }

  return {
    title: PV.Tabs.Podcasts.title,
    headerStyle: { backgroundColor: PV.Colors.grayDarkest },
    headerTintColor: darkTheme.text.color,
    headerTitleStyle: {
      fontSize,
      fontWeight: 'bold'
    },
    headerRight: <NavSearchIcon navigation={navigation} />
  } as NavigationStackOptions
}

const AuthNavigator = createStackNavigator(
  {
    [PV.RouteNames.AuthScreen]: AuthScreen
  },
  {
    defaultNavigationOptions
  }
)

const PodcastsNavigator = createStackNavigator(
  {
    [PV.RouteNames.PodcastsScreen]: {
      screen: PodcastsScreen,
      path: PV.DeepLinks.Podcasts.path
    },
    [PV.RouteNames.PodcastScreen]: {
      screen: PodcastScreen,
      path: PV.DeepLinks.Podcast.path
    },
    [PV.RouteNames.EpisodeScreen]: {
      screen: EpisodeScreen,
      path: PV.DeepLinks.Episode.path
    }
  },
  {
    defaultNavigationOptions,
    initialRouteName: PV.RouteNames.PodcastsScreen,
    navigationOptions: {
      tabBarIcon: ({ tintColor }) => (
        <Image source={PV.Tabs.Podcasts.icon} style={{ tintColor }} resizeMode={'contain'} />
      ),
      tabBarLabel: () => <TabBarLabel title={PV.Tabs.Podcasts.title} />,
      ...tabTestProps('tab_podcasts_screen')
    }
  }
)

const EpisodesNavigator = createStackNavigator(
  {
    [PV.RouteNames.EpisodesScreen]: EpisodesScreen,
    [PV.RouteNames.EpisodeScreen]: EpisodeScreen,
    [PV.RouteNames.EpisodePodcastScreen]: PodcastScreen
  },
  {
    defaultNavigationOptions,
    navigationOptions: {
      tabBarIcon: ({ tintColor }) => (
        <Image source={PV.Tabs.Episodes.icon} style={{ tintColor }} resizeMode={'contain'} />
      ),
      tabBarLabel: () => <TabBarLabel title={PV.Tabs.Episodes.title} />,
      ...tabTestProps('tab_episodes_screen')
    }
  }
)

const ClipsNavigator = createStackNavigator(
  {
    [PV.RouteNames.ClipsScreen]: ClipsScreen
  },
  {
    defaultNavigationOptions,
    navigationOptions: {
      tabBarIcon: ({ tintColor }) => <Image source={PV.Tabs.Clips.icon} style={{ tintColor }} resizeMode={'contain'} />,
      tabBarLabel: () => <TabBarLabel title={PV.Tabs.Clips.title} />,
      ...tabTestProps('tab_clips_screen')
    }
  }
)

const SearchNavigator = createStackNavigator(
  {
    [PV.RouteNames.SearchScreen]: { screen: SearchScreen, path: '' },
    [PV.RouteNames.SearchPodcastScreen]: PodcastScreen,
    [PV.RouteNames.SearchEpisodeScreen]: EpisodeScreen
  },
  {
    defaultNavigationOptions
  }
)

const MoreNavigator = createStackNavigator(
  {
    [PV.RouteNames.MoreScreen]: MoreScreen,
    [PV.RouteNames.DownloadsScreen]: DownloadsScreen,
    [PV.RouteNames.MyProfileScreen]: ProfileScreen,
    [PV.RouteNames.PlaylistScreen]: {
      screen: PlaylistScreen,
      path: PV.DeepLinks.Playlist.path
    },
    [PV.RouteNames.PlaylistsScreen]: {
      screen: PlaylistsScreen,
      path: PV.DeepLinks.Playlists.path
    },
    [PV.RouteNames.EditPlaylistScreen]: EditPlaylistScreen,
    [PV.RouteNames.EditProfileScreen]: EditProfileScreen,
    [PV.RouteNames.ProfileScreen]: {
      screen: ProfileScreen,
      path: PV.DeepLinks.Profile.path
    },
    [PV.RouteNames.ProfilesScreen]: {
      screen: ProfilesScreen,
      path: PV.DeepLinks.Profiles.path
    },
    [PV.RouteNames.SettingsScreen]: SettingsScreen,
    [PV.RouteNames.MoreEpisodeScreen]: EpisodeScreen,
    [PV.RouteNames.MorePlaylistScreen]: PlaylistScreen,
    [PV.RouteNames.MorePodcastScreen]: PodcastScreen,
    [PV.RouteNames.MembershipScreen]: MembershipScreen,
    [PV.RouteNames.AboutScreen]: AboutScreen,
    [PV.RouteNames.TermsOfServiceScreen]: TermsOfServiceScreen,
    [PV.RouteNames.FAQScreen]: FAQScreen,
    [PV.RouteNames.QueueScreen]: QueueScreen
  },
  {
    defaultNavigationOptions,
    navigationOptions: {
      tabBarIcon: ({ tintColor }) => {
        return (
          <View>
            <Image source={PV.Tabs.More.icon} style={{ tintColor }} resizeMode={'contain'} />
            <DownloadsActiveBadge />
          </View>
        )
      },
      tabBarLabel: () => <TabBarLabel title='More' />,
      ...tabTestProps('tab_more_screen')
    }
  }
)

const OnboardingNavigator = createStackNavigator(
  {
    [PV.RouteNames.OnboardingScreen]: OnboardingScreen,
    [PV.RouteNames.AuthNavigator]: AuthNavigator
  },
  {
    initialRouteName: PV.RouteNames.OnboardingScreen,
    mode: 'modal',
    headerMode: 'none'
  }
)

const QueueNavigator = createStackNavigator(
  {
    [PV.RouteNames.QueueScreen]: QueueScreen
  },
  {
    defaultNavigationOptions,
    navigationOptions: {
      tabBarIcon: ({ tintColor }) => {
        return (
          <View>
            <Image source={PV.Tabs.Queue.icon} style={{ tintColor }} resizeMode={'contain'} />
          </View>
        )
      },
      tabBarLabel: () => <TabBarLabel title={PV.Tabs.Queue.title} />,
      ...tabTestProps('tab_queue_screen')
    },
    initialRouteParams: { showMoreNavButton: true }
  }
)

const TabNavigator = createBottomTabNavigator(
  {
    Podcasts: { screen: PodcastsNavigator, path: '' },
    Episodes: EpisodesNavigator,
    Clips: ClipsNavigator,
    Queue: { screen: QueueNavigator, path: '' },
    More: { screen: MoreNavigator, path: PV.DeepLinks.Search.path }
  },
  {
    tabBarComponent: (props: any) => <PVTabBar {...props} />
  }
)

const PlayerNavigator = createStackNavigator(
  {
    [PV.RouteNames.PlayerScreen]: {
      screen: PlayerScreen,
      path: PV.DeepLinks.Clip.path
    },
    [PV.RouteNames.MakeClipScreen]: MakeClipScreen,
    [PV.RouteNames.QueueScreen]: QueueScreen,
    [PV.RouteNames.PlayerFAQScreen]: FAQScreen,
    [PV.RouteNames.PlayerMyProfileScreen]: ProfileScreen,
    [PV.RouteNames.PlayerMembershipScreen]: MembershipScreen
  },
  {
    defaultNavigationOptions
  }
)

const PlaylistsAddToNavigator = createStackNavigator(
  {
    [PV.RouteNames.PlaylistsAddToScreen]: PlaylistsAddToScreen
  },
  {
    defaultNavigationOptions
  }
)

const SleepTimerNavigator = createStackNavigator(
  {
    [PV.RouteNames.SleepTimerScreen]: SleepTimerScreen
  },
  {
    defaultNavigationOptions
  }
)

const WebPageNavigator = createStackNavigator(
  {
    [PV.RouteNames.WebPageScreen]: WebPageScreen
  },
  {
    defaultNavigationOptions
  }
)

const EmailVerificationNavigator = createStackNavigator(
  {
    [PV.RouteNames.EmailVerificationScreen]: EmailVerificationScreen
  },
  {
    defaultNavigationOptions
  }
)

const PurchasingNavigator = createStackNavigator(
  {
    [PV.RouteNames.PurchasingScreen]: PurchasingScreen
  },
  {
    defaultNavigationOptions
  }
)

const AddPodcastByRSSURLNavigator = createStackNavigator(
  {
    [PV.RouteNames.AddPodcastByRSSScreen]: {
      screen: AddPodcastByRSSScreen,
      path: PV.DeepLinks.AddByRSSPodcastFeedUrl.path
    }
  },
  {
    defaultNavigationOptions
  }
)

const ScanQRCodeScreenNavigator = createStackNavigator(
  {
    [PV.RouteNames.ScanQRCodeScreen]: {
      screen: ScanQRCodeScreen
    }
  },
  {
    defaultNavigationOptions
  }
)

const MainApp = createStackNavigator(
  {
    [PV.RouteNames.TabNavigator]: { screen: TabNavigator, path: '' },
    [PV.RouteNames.AuthNavigator]: AuthNavigator,
    [PV.RouteNames.PlayerNavigator]: { screen: PlayerNavigator, path: '' },
    PlaylistsAddToNavigator,
    SearchNavigator,
    SleepTimerNavigator,
    WebPageNavigator,
    EmailVerificationNavigator,
    PurchasingNavigator,
    ScanQRCodeScreenNavigator,
    [PV.RouteNames.AddPodcastByRSSScreen]: {
      screen: AddPodcastByRSSURLNavigator,
      path: ''
    }
  },
  {
    mode: 'modal',
    headerMode: 'none'
  }
)

const SwitchNavigator = createSwitchNavigator(
  {
    MainApp: { screen: MainApp, path: '' },
    Onboarding: OnboardingNavigator
  },
  {
    initialRouteName: PV.RouteNames.MainApp
  }
)

const App = createAppContainer(SwitchNavigator)
const prefix = PV.DeepLinks.prefix

export default () => <App uriPrefix={prefix} />
