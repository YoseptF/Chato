import React, { FC, useState } from "react";
import ButtonWithAction from "./ButtonWithAction";
import { Popover2 } from "@blueprintjs/popover2";
import Button from "../Button";

interface ButtonWithPopoverProps {
  deleteChat: (chatTitle: string) => void,
  setCurrentChatAndCloseMenu: (chatTitle: string) => void,
  title: string,
  id: string,
}


const ButtonWithPopover: FC<ButtonWithPopoverProps> = ({
  deleteChat,
  title,
  setCurrentChatAndCloseMenu,
  id,
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <Popover2
      enforceFocus
      isOpen={isPopupOpen}
      position="right"
      className="flex items-center justify-center class-2"
      content={(
        <div
          className='flex items-center justify-center'
          style={{
            margin: '0 auto',
            height: '100%',
            borderRadius: '5px',
            padding: '5px',
          }}
        >
          <Button
            type='button'
            large
            outlined
            className="flex items-center justify-center"
            style={{
              zIndex: 123,
              border: 'none',
              background: 'green',
              fontSize: '0.7rem',
              height: '20px',
              minHeight: '20px',
              padding: '0 5px',
            }}
            onClick={() => setIsPopupOpen(false)}
          >
            cancel
          </Button>
          <Button
            type='button'
            large
            outlined
            className="flex items-center justify-center"
            style={{
              zIndex: 123,
              border: 'none',
              background: 'red',
              fontSize: '0.7rem',
              height: '20px',
              minHeight: '20px',
              padding: '0 5px',
              marginLeft: '5px',
            }}
            onClick={() => {
              deleteChat(title);
              setIsPopupOpen(false);
            }}
          >
            delete chat
          </Button>
        </div>
      )}
    >

      <ButtonWithAction
        key={id}
        showAction={true}
        actionIcon="remove"
        onButtonClick={() => setCurrentChatAndCloseMenu(title)}
        onActionClick={() => setIsPopupOpen(c => !c)}
        buttonText={title}
      />
    </Popover2>
  )
}

export default ButtonWithPopover