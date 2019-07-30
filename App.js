import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground
} from "react-native";
import SocketIOClient from "socket.io-client";
import Ionicons from "react-native-vector-icons/Ionicons";
import AwesomeButtonRick from "react-native-really-awesome-button";
import { Permissions, Notifications } from "expo";
import GestureRecognizer from "react-native-swipe-gestures";
import {
  createAppContainer,
  createStackNavigator,
  createBottomTabNavigator
} from "react-navigation";
import { Icon } from "react-native-elements";

import { FluidNavigator, Transition } from "react-navigation-fluid-transitions";
import Pulse from "react-native-pulse";

var user = "";

var lastUsed = {
  rubro: "0",
  disciplina: "0",
  modalidad: "0"
};

String.prototype.format = function() {
  var i = 0,
    args = arguments;
  return this.replace(/{}/g, function() {
    return typeof args[i] != "undefined" ? args[i++] : "";
  });
};

async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Permissions.getAsync(
    Permissions.NOTIFICATIONS
  );
  let finalStatus = existingStatus;

  // only ask if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  if (existingStatus !== "granted") {
    // Android remote notification permissions are granted during the app
    // install, so this will only ask on iOS
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }

  // Stop here if the user did not grant permissions
  if (finalStatus !== "granted") {
    return;
  }

  // Get the token that uniquely identifies this device
  let token = await Notifications.getExpoPushTokenAsync();
  user = token;
  socket.emit("registerUserIfNotExists", { user: token });
}
registerForPushNotificationsAsync();
const placeholderFoto = require("./media/placeholder.jpg");
const background = require("./media/background.png");
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const socket = SocketIOClient("https://yoteaviso.herokuapp.com");

var drag = false;

function navigate(_this, request, query = {}) {
  console.log(request);
  console.info(query);
  query["user"] = user;

  console.log(query);
  socket.emit(request, query);
  _this.props.navigation.navigate(request);
}
function toggleNotification(from, id, to) {
  socket.emit(from, { user, id, to });
}
function dataReceptor(receptor, callback) {
  socket.on(receptor, data => callback(data));
}

class DataManager {
  constructor(user, context, get = false, id = false) {
    console.log("Constructor data");
    console.log(get);
    this.urls = {
      rubros: "http://enterate.com.uy/rest/DP_rubros",
      disciplinas:
        "http://enterate.com.uy/rest/DP_Disciplinas?RubroId={}&UsuarioAppIdentificadorTelefono={}",
      modalidades:
        "http://enterate.com.uy/rest/dp_modalidades?DisciplinaId={}&UsuarioAppIdentificadorTelefono={}",
      eventos:
        "http://enterate.com.uy/rest/DP_EventosModalidad?ModalidadId={}&UsuarioAppIdentificadorTelefono={}",
      noti: "http://100.24.93.32/yoteaviso/rest/CreateUserAppEvento"
    };
    this.user = user;
    this.get = get;
    this.id = id;
    this.context = context;
    this.data = [];

    this.getData();
  }

  async getData() {
    let url;
    console.log(this.get);
    if (this.get) {
      url = this.urls[this.get].format(this.id, this.user);
    } else {
      url = this.urls["rubros"];
    }
    console.log(this.get);
    console.log(this.id);
    console.log(url);

    console.log("URL: " + url);
    try {
      var myHeaders = new Headers();
      myHeaders.append("pragma", "no-cache");
      myHeaders.append("cache-control", "no-cache");

      var myInit = {
        method: "GET",
        headers: myHeaders
      };
      let response = await fetch(url, myInit);
      let responseJson = await response.json();
      console.log("RESPONSE !!!");
      console.log(responseJson);
      this.data = responseJson;
      console.log(responseJson);

      this.context.setState({ data: responseJson });
    } catch (error) {
      console.error(error);
    }
  }
}

class Notification extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      notification: this.props.notification,
      type: this.props.type
    };
    this.toggleNotification = this.toggleNotification.bind(this);
  }

  async toggleNotification() {
    console.log("executing notification");
    console.log(
      JSON.stringify({
        UsuarioAppIdentificadorTelefono: "User",
        EventoId: "1"
      })
    );

    const rawResponse = await fetch(
      "http://enterate.com.uy/rest/CreateUserAppEvento",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          UsuarioAppIdentificadorTelefono: "User",
          EventoId: "1"
        })
      }
    );
    const content = await rawResponse.json();
    console.log("Result");
    console.log(content);
    this.setState({ notification: !this.state.notification });
  }

  render() {
    return (
      <Ionicons
        style={{}}
        name={
          this.state.notification ? "md-notifications" : "md-notifications-off"
        }
        size={25}
        color={"#fff"}
        onPress={() => {
          this.toggleNotification();
        }}
      />
    );
  }
}

const flowLine = ["rubros", "disciplinas", "modalidades", "eventos"];
class Menu extends React.Component {
  constructor(props) {
    super(props);
    const { navigation } = this.props;

    let Enterate = new DataManager(
      "User",
      this,
      navigation.getParam("get", false),
      navigation.getParam("id", false)
    );

    this.state = {
      background,
      currentFlow: navigation.getParam("get", "rubros"),
      data: []
    };
  }

  render() {
    let data = this.state.data.map((data, idx) => {
      if (["disciplinas", "modalidades"].includes(this.state.currentFlow)) {
        let notification = (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              width: 60,
              backgroundColor: "rgba(252, 119, 83, 0.5)",
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 6
              },
              shadowOpacity: 0.39,
              shadowRadius: 8.3,

              elevation: 13
            }}
          >
            <Notification notification={true} type={"modalidad"} />
          </View>
        );

        return (
          <View key={idx}>
            <AwesomeButtonRick
              backgroundDarker={"rgba(252, 119, 83, 0.2)"}
              backgroundColor={"rgba(252, 119, 83, 0.9)"}
              width={SCREEN_WIDTH - 16}
              backgroundDarker={"transparent"}
              style={{
                margin: 8,
                shadowColor: "#000",
                shadowOffset: {
                  width: 2,
                  height: 4
                },
                shadowOpacity: 0.29,
                shadowRadius: 3,

                elevation: 13
              }}
              raiseLevel={0}
              onPress={() => {
                if (!drag) {
                  let nextFlow =
                    flowLine[flowLine.indexOf(this.state.currentFlow) + 1];
                  this.props.navigation.navigate(nextFlow, {
                    get: nextFlow,
                    id: data.Id
                  });
                }
              }}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "space-between",
                  paddingHorizontalLeft: 15
                }}
              >
                <Text style={styles.buttonTextLists}>{data.Nombre}</Text>
                {notification}
              </View>
            </AwesomeButtonRick>
          </View>
        );
      } else if (this.state.currentFlow == "rubros") {
        return (
          <View key={idx}>
            <AwesomeButtonRick
              borderRadius={15}
              raiseLevel={3}
              backgroundDarker={"rgba(252, 119, 83, 0.2)"}
              backgroundColor={"rgba(252, 119, 83, 0.8)"}
              width={SCREEN_WIDTH * 0.46 - 30}
              height={SCREEN_WIDTH * 0.46 - 30}
              style={{
                margin: 20
              }}
              onPress={() => {
                if (!drag) {
                  let nextFlow =
                    flowLine[flowLine.indexOf(this.state.currentFlow) + 1];
                  this.props.navigation.navigate(nextFlow, {
                    get: nextFlow,
                    id: data.Id
                  });
                }
              }}
            >
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Icon
                  raised
                  name="heartbeat"
                  type="font-awesome"
                  color="#rgba(252, 119, 83, 1)"
                  onPress={() => console.log("hello")}
                />
                <Text style={styles.buttonText}>{data.Nombre}</Text>
              </View>
            </AwesomeButtonRick>
          </View>
        );
      } else {
      }
    });
    return (
      <ImageBackground
        style={styles.backgroundImage}
        source={this.state.background}
      >
        <ScrollView
          contentContainerStyle={{
            marginTop: 10,
            width: SCREEN_WIDTH,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center"
          }}
          onScrollBeginDrag={() => {
            drag = true;
          }}
          onScrollEndDrag={() => {
            drag = false;
          }}
        >
          {data}
        </ScrollView>
      </ImageBackground>
    );
  }
}

class Eventos extends React.Component {
  constructor(props) {
    super(props);
    const { navigation } = this.props;

    let Enterate = new DataManager(
      "User",
      this,
      navigation.getParam("get", false),
      navigation.getParam("id", false)
    );
    this.state = {
      currentFlow: navigation.getParam("get", false),
      data: []
    };
  }
  static navigationOptions = {
    gesturesEnabled: true
  };

  render() {
    if (this.state.data && this.state.data.length > 0) {
      const data = this.state.data.map((evento, idx) => {
        let iconName;
        if (evento.EventoUsuarioMarcado) {
          iconName = "md-notifications";
        } else {
          iconName = "md-notifications-off";
        }
        return (
          <Transition key={idx} shared={evento.EventoNombre + "-header"}>
            <TouchableOpacity
              style={{
                width: SCREEN_WIDTH - 20,
                height: 100,
                marginLeft: 10,
                marginVertical: 10,
                borderRadius: 25,
                overflow: "hidden",
                backgroundColor: "#000"
              }}
              onPress={() => {
                this.props.navigation.navigate("InfoEvento", {
                  title: evento.EventoNombre,
                  image: evento.EventoImagen,
                  date: evento.EventoFechaRealizacion,
                  EventDescription: evento.EventoInformacionAdicional,
                  id: evento.EventoId
                });
              }}
            >
              <ImageBackground
                source={placeholderFoto}
                style={{
                  width: "100%",
                  height: "100%"
                }}
                opacity={0.8}
              >
                <Transition shared={evento.EventoNombre + "-title"}>
                  <View
                    style={{
                      height: "100%"
                    }}
                  >
                    <Text style={styles.EventDate}>
                      {evento.EventoFechaRealizacion}
                    </Text>
                    <Text style={styles.EventTitle}>{evento.EventoNombre}</Text>
                    <Text style={styles.EventTitle}> Empresa </Text>
                    <Ionicons
                      style={{ position: "absolute", right: 20, top: 25 }}
                      name={iconName}
                      size={45}
                      color={"#fff"}
                      onPress={() => {
                        toggleNotification(
                          "notiEventos",
                          evento.EventoId,
                          lastUsed.modalidad
                        );
                      }}
                    />
                  </View>
                </Transition>
              </ImageBackground>
            </TouchableOpacity>
          </Transition>
        );
      });
      return (
        <ImageBackground style={styles.backgroundImage} source={background}>
          <ScrollView
            onScrollBeginDrag={() => {
              drag = true;
            }}
            onScrollEndDrag={() => {
              drag = false;
            }}
          >
            {data}
          </ScrollView>
        </ImageBackground>
      );
    }
    console.log(this.state);
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Cargando...</Text>
      </View>
    );
  }
}

class Preferencias extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Preferencias</Text>
      </View>
    );
  }
}

class InfoEvento extends React.Component {
  constructor(props) {
    super(props);
    const { navigation } = this.props;

    var title = navigation.getParam("title", "Tu evento esta cargando...");
    var image = navigation.getParam("image", "");
    var date = navigation.getParam("date", "");
    var description = navigation.getParam("EventDescription", "");
    var id = navigation.getParam("id", "noid");
    let notification = navigation.getParam("notification", false);
    this.state = {
      title,
      image,
      date,
      description,
      id,
      notification
    };
  }

  componentDidMount() {
    if (this.props.navigation.getParam("getData", false)) {
      socket.emit("getEventData", {
        EventoId: this.props.navigation.getParam("EventId", "0")
      });
      socket.on("getEventData", data => {
        this.setState({
          title: data.EventoNombre,
          date: data.EventoFechaRealizacion,
          image: data.EventoImagen,
          description: data.EventoInformacionAdicional,
          id: data.EventoId,
          notification: data.EventoUsuarioMarcado
        });
      });
    }
  }

  render() {
    let iconName;
    if (this.state.notification) {
      iconName = "md-notifications";
    } else {
      iconName = "md-notifications-off";
    }
    return (
      <GestureRecognizer
        style={{ flex: 1 }}
        onSwipeRight={() => this.props.navigation.goBack()}
      >
        <Transition shared={this.state.title + "-header"}>
          <View style={{ backgroundColor: "#000" }}>
            <ImageBackground
              source={this.state.image}
              style={{
                width: "100%",
                height: 250
              }}
              opacity={0.8}
            >
              <Transition shared={this.state.title + "-title"}>
                <View
                  style={{
                    top: "65%",
                    height: "60%",
                    width: SCREEN_WIDTH
                  }}
                >
                  <Text style={styles.EventDate}>{this.state.date}</Text>

                  <Text style={styles.EventTitle}>{this.state.title}</Text>
                  <Ionicons
                    style={{ position: "absolute", right: 20, top: 25 }}
                    name={iconName}
                    size={45}
                    color={"#fff"}
                    onPress={() => {
                      toggleNotification("notiEventos", id);
                    }}
                  />
                </View>
              </Transition>
            </ImageBackground>
          </View>
        </Transition>

        <Transition appear="bottom">
          <View>
            <Text style={styles.EventDescription}>
              {this.state.description}
            </Text>
          </View>
        </Transition>
      </GestureRecognizer>
    );
  }
}

class firstScreen extends React.Component {
  constructor(props) {
    super();
    this.state = { rubros: [] };
    this.handleNav = this.handleNav.bind(this);
    socket.emit("Rubros", {});
    console.log("se manda");

    dataReceptor("Rubros", data => {
      console.log(data);
      console.log("se recibe algo");
      initialState = data.Rubros;
    });
  }
  componentDidMount() {
    console.log(this.state);
    console.log("First screen state");
  }
  static navigationOptions = {
    tabBarVisible: false
  };
  handleNav() {
    navigate(this, "Rubros");
  }
  render() {
    return (
      <Transition appear="vertical">
        <View style={styles.firstScreen}>
          <Pulse
            color="orange"
            numPulses={3}
            diameter={400}
            speed={30}
            duration={2000}
          />
          <Ionicons
            style={{
              fontSize: 100
            }}
            name={"md-notifications"}
            size={25}
            color={"#fff"}
            onPress={this.handleNav}
          />
        </View>
      </Transition>
    );
  }
}

const HomeStack = createStackNavigator({
  rubros: {
    screen: Menu,
    navigationOptions: ({ navigation }) => ({
      title: "Rubros",
      headerStyle: {
        backgroundColor: "#FC7753"
      },
      headerTitleStyle: {
        color: "#fff"
      }
    })
  },
  eventos: {
    screen: Eventos,
    navigationOptions: ({ navigation }) => ({
      title: "Eventos",
      headerStyle: {
        backgroundColor: "#FC7753"
      },
      headerTitleStyle: {
        color: "#fff"
      }
    })
  },
  InfoEvento: {
    screen: InfoEvento,
    navigationOptions: ({ navigation }) => ({
      title: "Descripcion del evento",
      headerStyle: {
        backgroundColor: "#FC7753"
      },
      headerTitleStyle: {
        color: "#fff"
      }
    })
  },
  disciplinas: {
    screen: Menu,
    navigationOptions: ({ navigation }) => ({
      title: "Disciplinas",
      headerStyle: {
        backgroundColor: "#FC7753"
      },
      headerTitleStyle: {
        color: "#fff"
      }
    })
  },
  modalidades: {
    screen: Menu,
    navigationOptions: ({ navigation }) => ({
      title: "Modalidades",
      headerStyle: {
        backgroundColor: "#FC7753"
      },
      headerTitleStyle: {
        color: "#fff"
      }
    })
  }
  // eventos: {
  //   screen: EventNavigation,
  //   navigationOptions: ({ navigation }) => ({
  //     title: "Eventos",
  //     headerStyle: {
  //       backgroundColor: "#FC7753"
  //     },
  //     headerTitleStyle: {
  //       color: "#fff"
  //     }
  //   })
  // }
  // Disciplinas: {
  //   screen: Disciplinas,
  //   navigationOptions: ({ navigation }) => ({
  //     title: "Disciplinas",
  //     headerStyle: {
  //       backgroundColor: "#FC7753"
  //     },
  //     headerTitleStyle: {
  //       color: "#fff"
  //     },
  //     headerBackTitleStyle: {
  //       color: "#fff"
  //     },
  //     headerTintColor: "#fff"
  //   })
  // },
  // Modalidades: {
  //   screen: Modalidades,
  //   navigationOptions: ({ navigation }) => ({
  //     title: "Modalidades",
  //     headerStyle: {
  //       backgroundColor: "#FC7753"
  //     },
  //     headerTitleStyle: {
  //       color: "#fff"
  //     },
  //     headerBackTitleStyle: {
  //       color: "#fff"
  //     },
  //     headerTintColor: "#fff"
  //   })
  // },
  // Eventos: {
  //   screen: EventNavigation,
  //   navigationOptions: ({ navigation }) => ({
  //     title: "Eventos",
  //     headerStyle: {
  //       backgroundColor: "#FC7753"
  //     },
  //     headerTitleStyle: {
  //       color: "#fff"
  //     },
  //     headerBackTitleStyle: {
  //       color: "#fff"
  //     },
  //     headerTintColor: "#fff",
  //     gesturesEnabled: false
  //   })
  // }
});

const SettingsStack = createStackNavigator({
  Preferencias: { screen: Preferencias }
});

const Main = createBottomTabNavigator(
  {
    Inicio: { screen: HomeStack }
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;
        if (routeName === "Inicio") {
          iconName = `ios-home`;
        } else if (routeName === "Preferencias") {
          iconName = `ios-settings`;
        }

        // You can return any component that you like here! We usually use an
        // icon component from react-native-vector-icons
        return <Ionicons name={iconName} size={25} color={tintColor} />;
      }
    }),
    tabBarOptions: {
      activeTintColor: "tomato",
      inactiveTintColor: "gray",

      style: {
        backgroundColor: "transparent"
      }
    }
  }
);

export default createAppContainer(
  FluidNavigator({
    Main: {
      screen: Main
    }
  })
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  },
  buttonTextLists: {
    color: "#fff",
    position: "absolute",
    fontSize: 20,
    marginLeft: 15,
    flex: 1
  },
  Rubros: {
    marginTop: 20,
    flex: 1,
    width: SCREEN_WIDTH,
    flexDirection: "row",
    flexWrap: "wrap"
  },
  EventTitle: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    left: "5%",
    top: "10%",
    width: "60%"
  },
  EventDate: {
    fontSize: 14,
    color: "#fff",
    left: "5%",
    top: "10%",
    width: "60%"
  },
  EventDateBlack: {
    fontSize: 14,
    color: "#000",
    marginLeft: 10,
    top: "5%",
    width: "60%"
  },
  EventDescription: {
    marginTop: 20,
    fontSize: 16,
    paddingHorizontal: 10
  },
  EventSubtitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold"
  },
  EventSubtitleContainer: {
    left: 10,
    top: "65%",
    width: SCREEN_WIDTH * 0.6
  },
  EventTitleDown: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
    left: "5%",
    top: "65%",
    width: "60%"
  },
  EventDateDown: {
    fontSize: 14,
    color: "#fff",
    left: "5%",
    top: "65%",
    width: "60%"
  },
  firstScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FC7753"
  },
  backgroundImage: {
    resizeMode: "contain",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    aspectRatio: 1
  }
});
