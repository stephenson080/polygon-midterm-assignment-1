import {Container, Button, Menu} from 'semantic-ui-react'

type Props = {
    isConnected: boolean
    currentAcct: string | undefined
    accountBal: string
    connectDisconnectWallet: () => void
}
export default function Header({isConnected, accountBal, currentAcct, connectDisconnectWallet}: Props){
    return (
        <Container>
        <Menu secondary>
          <Menu.Item name="Polygon Academy Task 2" />
          <Menu.Menu position="right">
            <Menu.Item color={isConnected ? "green" : "orange"}>
              {currentAcct
                ? `${currentAcct.slice(0, 8)}..., Your Bal: ${accountBal} matic`
                : "No Wallet Connected"}
            </Menu.Item>
            <Menu.Item>
              <Button
                onClick={connectDisconnectWallet}
                color={currentAcct ? "red" : "purple"}
              >
                {currentAcct ? "Disconnect Wallet" : "ConnectWallet"}
              </Button>
            </Menu.Item>
          </Menu.Menu>
        </Menu>
      </Container>
    )
}