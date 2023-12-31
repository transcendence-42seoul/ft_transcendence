import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameReadyPage, { IGame } from './ready/GameReadyPage';
import GamePlayPage from './play/pong/GamePlayPage';
import axios from 'axios';
import { getCookie } from '../common/cookie/cookie';
import {
  gameSocket,
  gameSocketConnect,
  gameSocketDisconnect,
} from './socket/game.socket';
import { Center, Spinner } from '@chakra-ui/react';
import { appSocket } from '../common/socket/app.socket';

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  PLAYING = 'PLAYING',
}

const GamePage = () => {
  const [userStatus, setUserStatus] = useState<UserStatus>(UserStatus.OFFLINE);
  const [gameData, setGameData] = useState<IGame | null>(null);

  const [myId, setMyId] = useState<string>('');
  const navigation = useNavigate();
  useEffect(() => {
    const getMyId = async () => {
      const token = getCookie('token');

      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/auth`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      response.data.id && setMyId(response.data.id);
    };

    const setGameState = async () => {
      try {
        const token = getCookie('token');
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/games`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response.data) setUserStatus(UserStatus.PLAYING);
        setGameData(response.data);
      } catch (error) {
        navigation('/main');
      }
    };

    gameSocket.on('error', (error) => {
      navigation('/login');
      console.error('Socket connection error:', error);
    });

    gameSocket.on('disconnect', () => {
      console.error('게임 소켓이 연결이 끊겼습니다.');
    });

    try {
      gameSocketConnect();
      setGameState();
      getMyId();
    } catch (error) {
      console.log(error);
    }

    return () => {
      gameSocket.off('error');
      gameSocket.off('disconnect');
      gameSocketDisconnect();
    };
  }, []);

  return (
    <>
      {userStatus === UserStatus.PLAYING && gameData ? (
        <GamePlayPage myId={myId} gameData={gameData} />
      ) : (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner
            className="flex justify-center"
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
        </div>
      )}
    </>
  );
};

export default GamePage;
