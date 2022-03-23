
import { useState } from 'react';
import { notification } from 'antd';
import moment from 'moment';

import logo from './logo-black-turing.png';
import './App.css';

const URL = 'https://kusama.api.subscan.io/api/scan/parachain/contributes';

function App() {
  const [loading, setLoading] = useState(false);

  const requestPage = async (pageIndex) => {
    const requestData = {
      "page": pageIndex,
      "row": 100,
      "fund_id": "2114-68",
      "order": "block_num asc",
      "from_history": true,
    };
    const response = await fetch(URL, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return response.json();
  }

  const downloadFile = ({ data, fileName, fileType }) => {
    console.log('downloadFile: ', data);
    // Create a blob with the data we want to download as a file
    const blob = new Blob([data], { type: fileType })
    // Create an anchor element and dispatch a click event on it
    // to trigger a download
    const a = document.createElement('a');
    a.download = fileName;
    a.href = window.URL.createObjectURL(blob);
    const clickEvt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    a.dispatchEvent(clickEvt);
    a.remove();
  }

  const exportToCsv = data => {
    console.log('exportToCsv: ', data);
    // Headers for each column
    let headers = ['ExtrinsicIndex, BlockBum, Timestamp,WalletAddress,KsmContribution'];
  
    // Convert users data to a csv
    let contributionsCsv = data.reduce((acc, contribution) => {
      const { extrinsic_index, block_num, block_timestamp, who, contributing } = contribution;
      acc.push([extrinsic_index, block_num, moment(block_timestamp * 1000).utc().format(), who, contributing / 10 ** 12].join(','));
      return acc;
    }, [])
  
    downloadFile({
      data: [...headers, ...contributionsCsv].join('\n'),
      fileName: 'contributions.csv',
      fileType: 'text/csv',
    });
  }

  //Timestamp, wallet address, ksm contribution
  const onRequestFinished = (contributions) => {
    console.log('totalContributions: ', contributions);
    exportToCsv(contributions);
  }

  const startQuery = (pageIndex, totalContributions) => {
    setTimeout(async () => {
      try {
        const result = await requestPage(pageIndex);
        if (result.code !== 0) {
          throw new Error('network error');
        }

        console.log('result: ', result);
        const contributions = result.data.contributes;
        if (contributions === null) {
          setLoading(false);
          onRequestFinished(totalContributions);
          return;
        }
        totalContributions.push(...contributions);
        startQuery(pageIndex + 1, totalContributions);
      } catch (error) {
        setLoading(false);
        notification.open({ message: 'Network Error', description: 'Please try again!'})
      }
    }, 1000);
  }

  const onClicked = async () => {
    setLoading(true);
    startQuery(0, []);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} alt="logo" style={{ width: '300px' }} />
        <div style={{ marginTop: '5rem' }}>
          {!loading && <span
            className="App-link"
            // href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ cursor: 'pointer' }}
            onClick = {onClicked}
          >
            Download the CSV of Turing Network contributions.
          </span>}
          {loading && <span className="App-link">Loading ...</span>}
        </div>
      </header>
    </div>
  );
}

export default App;
