import debounce from 'lodash/debounce'
import { Alert, StyleSheet } from 'react-native'
import React from 'reactn'
import { ActionSheet, ActivityIndicator, ButtonGroup, Divider, FlatList, PodcastTableCell, SearchBar, View
  } from '../components'
import { alertIfNoNetworkConnection } from '../lib/network'
import { generateAuthorsText, generateCategoriesText } from '../lib/utility'
import { PV } from '../resources'
import { getPodcasts } from '../services/podcast'
import { toggleSubscribeToPodcast } from '../state/actions/podcast'
import { core } from '../styles'

const { aboutKey, allEpisodesKey, clipsKey } = PV.Filters

type Props = {
  navigation?: any
}

type State = {
  endOfResultsReached?: boolean
  flatListData: any[]
  flatListDataTotalCount: number | null
  isLoading?: boolean
  isLoadingMore?: boolean
  queryPage: number
  searchBarText: string
  searchType: number
  selectedPodcast?: any
  showActionSheet: boolean
}

export class SearchScreen extends React.Component<Props, State> {
  static navigationOptions = {
    title: 'Search'
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      endOfResultsReached: false,
      flatListData: [],
      flatListDataTotalCount: null,
      isLoading: false,
      isLoadingMore: false,
      queryPage: 1,
      searchBarText: '',
      searchType: 0,
      showActionSheet: false
    }

    this._handleSearchBarTextQuery = debounce(this._handleSearchBarTextQuery, 1000)
  }

  _handleSearchBarClear = (text: string) => {
    this.setState({
      flatListData: [],
      flatListDataTotalCount: null,
      searchBarText: ''
    })
  }

  _handleSearchBarTextChange = (text: string) => {
    const { isLoading } = this.state

    this.setState({
      flatListData: [],
      flatListDataTotalCount: null,
      ...(!isLoading && text ? { isLoading: true } : {}),
      queryPage: 1,
      searchBarText: text
    }, async () => {
      this._handleSearchBarTextQuery()
    })
  }

  _handleSearchBarTextQuery = async (nextPage?: boolean) => {
    if (!this.state.searchBarText) {
      this.setState({ isLoading: false })
      return
    }

    const state = await this._queryData(nextPage)
    this.setState(state)
  }

  _ItemSeparatorComponent = () => {
    return <Divider />
  }

  _onEndReached = ({ distanceFromEnd }) => {
    const { endOfResultsReached, isLoadingMore } = this.state
    if (!endOfResultsReached && !isLoadingMore) {
      if (distanceFromEnd > -1) {
        this.setState({
          isLoadingMore: true
        }, async () => {
          const newState = await this._queryData(true)
          this.setState(newState)
        })
      }
    }
  }

  _handleSearchTypePress = (index) => this.setState({ searchType: index })

  _handleCancelPress = () => this.setState({ showActionSheet: false })

  _handleMorePress = (podcast: any) => {
    this.setState({
      selectedPodcast: podcast,
      showActionSheet: true
    })
  }

  _handleNavigationPress = (podcast: any, viewType: string) => {
    this.setState({ showActionSheet: false })
    this.props.navigation.navigate(
      PV.RouteNames.SearchPodcastScreen, {
        podcast,
        viewType,
        isSearchScreen: true
      }
    )
  }

  _renderPodcastItem = ({ item }) => {
    return (
      <PodcastTableCell
        key={`SearchScreen_${item.id}`}
        id={item.id}
        lastEpisodePubDate={item.lastEpisodePubDate}
        onPress={() => this._handleMorePress(item)}
        podcastAuthors={generateAuthorsText(item.authors)}
        podcastCategories={generateCategoriesText(item.categories)}
        podcastImageUrl={item.imageUrl}
        podcastTitle={item.title} />
    )
  }

  _moreButtons = (): any[] => {
    const { selectedPodcast } = this.state
    const { subscribedPodcastIds } = this.global.session.userInfo
    const isSubscribed = selectedPodcast && subscribedPodcastIds
      && subscribedPodcastIds.some((id: any) => id === selectedPodcast.id)

    return [
      {
        key: 'toggleSubscribe',
        text: isSubscribed ? 'Unsubscribe' : 'Subscribe',
        onPress: () => selectedPodcast && this._toggleSubscribeToPodcast(selectedPodcast.id)
      },
      {
        key: 'episodes',
        text: 'Episodes',
        onPress: () => this._handleNavigationPress(selectedPodcast, allEpisodesKey)
      },
      {
        key: 'clips',
        text: 'Clips',
        onPress: () => this._handleNavigationPress(selectedPodcast, clipsKey)
      },
      {
        key: 'about',
        text: 'About',
        onPress: () => this._handleNavigationPress(selectedPodcast, aboutKey)
      }
    ]
  }

  _toggleSubscribeToPodcast = async (id: string) => {
    const wasAlerted = await alertIfNoNetworkConnection('subscribe to this podcast')
    if (wasAlerted) return

    try {
      await toggleSubscribeToPodcast(id, this.global)
    } catch (error) {
      Alert.alert(PV.Alerts.SOMETHING_WENT_WRONG.title, PV.Alerts.SOMETHING_WENT_WRONG.message, [])
    }
    this.setState({ showActionSheet: false })
  }

  render() {
    const { flatListData, flatListDataTotalCount, isLoading, isLoadingMore, searchBarText, searchType,
      showActionSheet } = this.state

    return (
      <View style={styles.view}>
        <ButtonGroup
          buttons={buttons}
          onPress={this._handleSearchTypePress}
          selectedIndex={searchType} />
        <SearchBar
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={core.searchBar}
          onChangeText={this._handleSearchBarTextChange}
          onClear={this._handleSearchBarClear}
          placeholder='search'
          value={searchBarText} />
        <Divider />
        {
          !isLoading && flatListData &&
            <FlatList
              data={flatListData}
              dataTotalCount={flatListDataTotalCount}
              disableLeftSwipe={true}
              extraData={flatListData}
              isLoadingMore={isLoadingMore}
              ItemSeparatorComponent={this._ItemSeparatorComponent}
              onEndReached={this._onEndReached}
              renderItem={this._renderPodcastItem}
              resultsText='podcasts' />
        }
        {
          isLoading &&
            <ActivityIndicator />
        }
        <ActionSheet
          handleCancelPress={this._handleCancelPress}
          items={this._moreButtons()}
          showModal={showActionSheet} />
      </View>
    )
  }

  _queryData = async (nextPage?: boolean) => {
    const { flatListData, queryPage, searchBarText, searchType } = this.state
    const page = nextPage ? queryPage + 1 : 1

    const newState = {
      isLoading: false,
      isLoadingMore: false
    }

    const wasAlerted = await alertIfNoNetworkConnection('search podcasts')
    if (wasAlerted) return newState

    try {
      const results = await getPodcasts({
        page,
        ...(searchType === _podcastByTitle ? { searchTitle: searchBarText } : {}),
        ...(searchType === _podcastByHost ? { searchAuthor: searchBarText } : {})
      }, this.global.settings.nsfwMode)

      const newFlatListData = [...flatListData, ...results[0]]

      return {
        ...newState,
        endOfResultsReached: newFlatListData.length >= results[1],
        flatListData: newFlatListData,
        flatListDataTotalCount: results[1],
        queryPage: page
      }
    } catch (error) {
      return newState
    }
  }
}

const _podcastByTitle = 0
const _podcastByHost = 1

const buttons = ['Podcast', 'Host']

const styles = StyleSheet.create({
  searchBarContainer: {
    borderBottomWidth: 0,
    borderTopWidth: 0,
    flex: 0,
    height: PV.FlatList.searchBar.height,
    justifyContent: 'center'
  },
  view: {
    flex: 1,
    justifyContent: 'flex-start'
  }
})