import {
  useEffect,
  useMemo,
  ReactElement,
  ReactNode,
  isValidElement,
  cloneElement,
  forwardRef,
  Children as ReactChildren,
} from 'react'
import styled from 'styled-components'
import { useMenu } from './Menu.context'
import type { FocusTarget } from './Menu.types'
import { MenuItemProps, MenuItem } from './MenuItem'
import { MenuSectionProps, MenuSection } from './MenuSection'
import { menu as tokens } from './Menu.tokens'
import { spacingsTemplate } from '../../utils'

const List = styled.ul`
  position: relative;
  list-style: none;
  margin: 0;
  ${spacingsTemplate(tokens.spacings)}
  li:first-child {
    z-index: 3;
  }
`
type MenuListProps = {
  focus?: FocusTarget
  children: ReactNode
}

type MenuChild = ReactElement<MenuItemProps> & ReactElement<MenuSectionProps>

type Direction = 'down' | 'up'

function isIndexable(item: MenuChild) {
  if (isValidElement(item) && !item.props.disabled && item.type === MenuItem)
    return true
  return false
}

export const MenuList = forwardRef<HTMLUListElement, MenuListProps>(
  function MenuList({ children, focus, ...rest }, ref) {
    const { focusedIndex, setFocusedIndex } = useMenu()

    let index = -1
    const focusableIndexs: number[] = useMemo<number[]>(() => [], [])

    const updatedChildren: Array<MenuChild> = useMemo(
      () =>
        ReactChildren.map(children, (child: MenuChild) => {
          if (child.type === MenuSection) {
            const updatedGrandChildren = ReactChildren.map(
              child.props.children,
              (grandChild: MenuChild) => {
                index++
                if (isIndexable(grandChild)) focusableIndexs.push(index)
                return cloneElement(grandChild, { index })
              },
            )
            return cloneElement(child, null, updatedGrandChildren)
          } else {
            index++
            if (isIndexable(child)) focusableIndexs.push(index)
            return cloneElement(child, { index })
          }
        }),
      [children, focusableIndexs, index],
    )

    const firstFocusIndex = focusableIndexs[0]
    const lastFocusIndex = focusableIndexs[focusableIndexs.length - 1]

    useEffect(() => {
      if (focus === 'first') {
        setFocusedIndex(firstFocusIndex)
      }
      if (focus === 'last') {
        setFocusedIndex(lastFocusIndex)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focus, firstFocusIndex, lastFocusIndex])

    const handleMenuItemChange = (
      direction: Direction,
      fallbackIndex: number,
    ) => {
      const i = direction === 'down' ? 1 : -1
      const currentFocus: number = focusableIndexs.indexOf(focusedIndex)
      const nextMenuItem: number = focusableIndexs[currentFocus + i]
      const nextFocusedIndex: number =
        typeof nextMenuItem === 'undefined' ? fallbackIndex : nextMenuItem

      setFocusedIndex(nextFocusedIndex)
    }

    const handleKeyPress = (event: React.KeyboardEvent<HTMLUListElement>) => {
      const { key } = event
      event.stopPropagation()

      if (key === 'ArrowDown') {
        event.preventDefault()
        handleMenuItemChange('down', firstFocusIndex)
      }
      if (key === 'ArrowUp') {
        event.preventDefault()
        handleMenuItemChange('up', lastFocusIndex)
      }
    }

    return (
      <List onKeyDown={handleKeyPress} role="menu" {...rest} ref={ref}>
        {updatedChildren}
      </List>
    )
  },
)

// MenuList.displayName = 'EdsMenuList'
