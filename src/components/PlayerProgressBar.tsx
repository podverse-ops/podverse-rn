import { Dimensions, StyleSheet, View } from 'react-native'
import { Slider } from 'react-native-elements'
import React from 'reactn'
import { convertSecToHHMMSS } from '../lib/utility'
import { PV } from '../resources'
import { PVTrackPlayer, setPlaybackPosition } from '../services/player'
import { Text } from './'

type Props = {
  clipEndTime?: number | null
  clipStartTime?: number | null
  globalTheme: any
  value: number
}

type State = {
  bufferedPosition: number
  duration: number
  position: number
  slidingPosition: number | null
}

export class PlayerProgressBar extends PVTrackPlayer.ProgressComponent<Props, State> {

  constructor(props: Props) {
    super(props)

    this.state = {
      bufferedPosition: 0,
      duration: 0,
      position: 0,
      slidingPosition: null
    }
  }

  render() {
    const { clipEndTime, clipStartTime, globalTheme } = this.props
    const { duration, position, slidingPosition } = this.state
    const pos = slidingPosition || position
    const value = duration > 0 ? pos / duration : 0

    const clipStartTimePosition = { left: 0 }
    const clipEndTimePosition = { left: 0 }
    const screenWidth = Dimensions.get('window').width

    if (clipStartTime && duration > 0) {
      const leftPosition = screenWidth * (clipStartTime / duration)
      clipStartTimePosition.left = leftPosition
    }

    if (clipEndTime && duration > 0) {
      const leftPosition = (screenWidth * (clipEndTime / duration))
      clipEndTimePosition.left = leftPosition
    }

    return (
      <View style={styles.wrapper}>
        {
          (duration > 0 && (clipStartTime || clipStartTime === 0)) &&
            <View style={[styles.clipStartTimeFlag, globalTheme.playerClipTimeFlag, clipStartTimePosition]} />
        }
        {
          (duration > 0 && clipEndTime) &&
            <View style={[styles.clipEndTimeFlag, globalTheme.playerClipTimeFlag, clipEndTimePosition]} />
        }
        <Slider
          minimumValue={0}
          maximumValue={1}
          onSlidingComplete={(value) => {
            const position = value * duration
            setPlaybackPosition(position)
            this.setState({
              position,
              slidingPosition: null
            })
          }}
          onValueChange={(value) => this.setState({ slidingPosition: value * duration })}
          thumbStyle={styles.thumbStyle}
          thumbTintColor={PV.Colors.brandColor}
          value={value} />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{convertSecToHHMMSS(slidingPosition || position)}</Text>
          <Text style={styles.time}>{duration > 0 ? convertSecToHHMMSS(duration) : '--:--'}</Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  clipEndTimeFlag: {
    height: 36,
    left: 0,
    position: 'absolute',
    top: 2,
    width: 2
  },
  clipStartTimeFlag: {
    height: 36,
    left: 0,
    position: 'absolute',
    top: 2,
    width: 2
  },
  thumbStyle: {
    borderRadius: 0,
    height: 24,
    width: 6
  },
  time: {
    fontSize: 14,
    lineHeight: 14,
    marginHorizontal: 12
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  wrapper: {
    height: 56,
    position: 'relative'
  }
})