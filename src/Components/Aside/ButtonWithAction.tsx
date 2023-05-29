import React, { FC } from "react";
import Button from "../Button";
import { IconName } from "@blueprintjs/core";

interface ButtonWithActionProps {
  showAction: boolean,
  buttonIcon?: IconName,
  actionIcon?: IconName,
  onButtonClick: () => void,
  onActionClick?: () => void,
  buttonText: string,
}

const ButtonWithAction: FC<ButtonWithActionProps> = ({
  showAction,
  buttonIcon,
  actionIcon,
  onButtonClick,
  onActionClick,
  buttonText,
}) => {
  return (
    <div
      className="flex flex-row"
    >
      <Button
        icon={buttonIcon}
        type='button'
        large
        outlined
        onClick={onButtonClick}
        text={buttonText}
        style={{ width: `calc(100% - ${showAction ? '40px' : '0px'})` }}
      />
      {
        showAction && (
          <Button
            icon={actionIcon}
            type='button'
            large
            outlined
            onClick={onActionClick}
            style={{ width: '40px' }}
          />
        )
      }
    </div>
  )
}

export default ButtonWithAction