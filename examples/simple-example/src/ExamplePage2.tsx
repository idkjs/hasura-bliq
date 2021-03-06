import React, {useEffect, useRef, useState} from 'react'
import {useAppStore} from "./store";
import {observer} from 'mobx-react'
import {getEnv, getSnapshot} from "mobx-state-tree";
import gql from 'graphql-tag';
import moment from "moment";
import {SubscriptionClient} from "subscriptions-transport-ws";
import {GraphQLClient} from "graphql-request";
import {useLiveQueryWithStore} from "hasura-bliq";
import {StoreType} from "mst-gql/dist/MSTGQLStore";

interface ExamplePage2Props {}


const query = gql`
    query findUpdatedMessages {
        message(
            distinct_on: [id]
            limit: 10
        ) {
            __typename
            id
            createdAt
            updatedAt
            message
        }
    }
`

//console.log("query json", JSON.stringify(query, null, 2));

export const ExamplePage2 = observer((props: ExamplePage2Props) => {
  const appStore = useAppStore()

  const [resultList, setResultList] = useState<any[]>([])
  const [subsTurnoffLimit, setSubsTurnoffLimit] = useState(10)

  const liveQueryInfo = useLiveQueryWithStore({
    store: appStore.gqlStore,
    query: query,
    startDate: moment.utc().format(),
    config: {
      startDateVariable: "theStartDate"
    },
    onData: (data) => {
      console.log("data via subscription", data)
      setResultList(resultList.concat((data as any).message))
    },
    debug: true
  });

  useEffect(() => {
    // If more than 10 received, finish subscription
    if (resultList.length >= subsTurnoffLimit) {
      if (liveQueryInfo) {
        liveQueryInfo.unsubscribe()
      }
      return;
    }
  }, [resultList])

  return (
    <>
      <div>Load some messages using insertmessages.sh.</div>
      <div>This page will list 10 messages, then turn off subscription. You can turn it back on with the "Allow 10 more" button.
        This will start listening to new messages from the time when the button is pressed (in between messages
      will not be delivered here)</div>
      <button onClick={()=>{
        setSubsTurnoffLimit(subsTurnoffLimit+10)
        liveQueryInfo.restart(moment.utc().format())
      }}>Allow 10 more</button>
      {resultList.map((value, index) => {
        return <div key={index}>{value["id"]}. {JSON.stringify(value)}</div>
        }
      )}
    </>
  );
});
