import React, { PropsWithChildren, CSSProperties, FC, useContext } from 'react';
import classNames from 'classnames';

import { MenuContext } from './menu';

export interface IMenuItemProps {
  index?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const MenuItem: FC<PropsWithChildren<IMenuItemProps>> = props => {
  const { children, index, disabled, className, style } = props;
  const context = useContext(MenuContext);

  const clasess = classNames('menu-item', className, {
    disabled: disabled,
    active: context.index === index
  });

  const handleClick = () => {
    if (context.onSelect && !disabled && typeof index === 'string') {
      context.onSelect(index);
    }
  };

  return (
    <li className={clasess} style={style} onClick={handleClick}>
      {children}
    </li>
  );
};

MenuItem.displayName = 'MenuItem';

export default MenuItem;
