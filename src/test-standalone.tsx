/**
 * Test page for debugging StandaloneFlamegraph component
 * with collapsed stack format data
 */

import '../assets/reset.css'
import '../assets/source-code-pro.css'

import {createRoot} from 'react-dom/client'
import {StandaloneFlamegraph} from './standalone-flamegraph'
import {useState} from 'react'

console.log(`speedscope test page v${require('../package.json').version}`)

// Sample collapsed stack data
const sampleCollapsedStack = `Java: VM Periodic Task Thread (41731);libsystem_pthread.dylib.thread_start();libsystem_pthread.dylib._pthread_start();libjvm.dylib.thread_native_entry();libjvm.dylib.Thread::call_run();libjvm.dylib.WatcherThread::run();libjvm.dylib.WatcherThread::sleep();libjvm.dylib.Monitor::wait_without_safepoint_check();libjvm.dylib.os::PlatformMonitor::wait();libsystem_kernel.dylib.__psynch_cvwait() 44
Java: C1 CompilerThread0 (23299);libsystem_pthread.dylib.thread_start();libsystem_pthread.dylib._pthread_start();libjvm.dylib.thread_native_entry();libjvm.dylib.Thread::call_run();libjvm.dylib.JavaThread::thread_main_inner();libjvm.dylib.CompileBroker::compiler_thread_loop();libjvm.dylib.CompileBroker::invoke_compiler_on_method();libjvm.dylib.Compiler::compile_method();libjvm.dylib.Compilation::Compilation();libjvm.dylib.Compilation::compile_method();libjvm.dylib.Compilation::compile_java_method();libjvm.dylib.Compilation::build_hir();libjvm.dylib.IR::IR();libjvm.dylib.IRScope::IRScope();libjvm.dylib.GraphBuilder::GraphBuilder();libjvm.dylib.GraphBuilder::iterate_all_blocks();libjvm.dylib.GraphBuilder::iterate_bytecodes_for_block();libjvm.dylib.GraphBuilder::invoke();libjvm.dylib.GraphBuilder::try_inline();libjvm.dylib.GraphBuilder::try_inline_full();libjvm.dylib.GraphBuilder::iterate_all_blocks();libjvm.dylib.GraphBuilder::iterate_bytecodes_for_block();libjvm.dylib.GraphBuilder::invoke();libjvm.dylib.GraphBuilder::try_inline();libjvm.dylib.GraphBuilder::try_inline_full();libjvm.dylib.GraphBuilder::iterate_all_blocks();libjvm.dylib.GraphBuilder::iterate_bytecodes_for_block();libjvm.dylib.GraphBuilder::access_field();libjvm.dylib.ciBytecodeStream::get_field();libjvm.dylib.ciEnv::get_field_by_index();libjvm.dylib.ciEnv::get_field_by_index_impl();libjvm.dylib.ciField::ciField();libjvm.dylib.InstanceKlass::find_field();libjvm.dylib.InstanceKlass::find_local_field() 2
main;foo;bar 100
main;foo;baz 50
main;qux 25`

function TestApp() {
  const [profileData, setProfileData] = useState<string>(sampleCollapsedStack)
  const [fileName, setFileName] = useState<string>('test.collapsedstack.txt')

  return (
    <div style={{padding: '20px', fontFamily: 'sans-serif'}}>
      <h1>StandaloneFlamegraph Test Page</h1>

      <div
        style={{marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px'}}
      >
        <h3>Debug Info</h3>
        <p>
          <strong>Profile Data Size:</strong> {profileData.length} characters
        </p>
        <p>
          <strong>File Name:</strong> {fileName}
        </p>
        <p>
          <strong>Lines:</strong> {profileData.split('\n').length}
        </p>
      </div>

      <div style={{marginBottom: '20px'}}>
        <label>
          <strong>File Name:</strong>
          <input
            type="text"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            style={{marginLeft: '10px', padding: '5px', width: '300px'}}
          />
        </label>
      </div>

      <div style={{marginBottom: '20px'}}>
        <label>
          <strong>Profile Data:</strong>
          <br />
          <textarea
            value={profileData}
            onChange={e => setProfileData(e.target.value)}
            style={{
              width: '100%',
              height: '150px',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '10px',
            }}
          />
        </label>
      </div>

      <div style={{border: '2px solid #ccc', borderRadius: '5px'}}>
        <h3
          style={{
            padding: '10px',
            margin: 0,
            background: '#f5f5f5',
            borderBottom: '1px solid #ccc',
          }}
        >
          Flamegraph Output
        </h3>
        <div style={{padding: '10px'}}>
          <StandaloneFlamegraph
            profileData={profileData}
            fileName={fileName}
            width="100%"
            height={600}
            onProfileLoad={profile => {
              console.log('✅ Profile loaded successfully!')
              console.log('Profile name:', profile.getName())
              console.log('Total weight:', profile.getTotalWeight())
              console.log('Total non-idle weight:', profile.getTotalNonIdleWeight())
            }}
            onError={error => {
              console.error('❌ Error loading profile:', error)
            }}
          />
        </div>
      </div>
    </div>
  )
}

const root = createRoot(document.body)
root.render(<TestApp />)
